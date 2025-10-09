import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getJSON } from '../../lib/api'

type Company = { id: number; name: string }
type Contact = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
}
type Scope = { name: string; cost: number; status: 'Pending' | 'Won' | 'Lost' }
type Bid = {
  id: number
  projectName: string
  clientCompany: Company
  contact?: Contact | null
  proposalDate?: string | null
  dueDate?: string | null
  followUpOn?: string | null
  jobLocation?: string | null
  leadSource?: string | null
  bidStatus: 'Active' | 'Complete' | 'Archived' | 'Hot' | 'Cold'
  scopes: Scope[]
}

const currency = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const dateFmt = (d?: string | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : '—'

function statusBadge(s: 'Pending' | 'Won' | 'Lost') {
  const base = 'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm'
  if (s === 'Won')
    return (
      <span className={`${base} bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200`}>
        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Won
      </span>
    )
  if (s === 'Lost')
    return (
      <span className={`${base} bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200`}>
        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        Lost
      </span>
    )
  return (
    <span className={`${base} bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200`}>
      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
      Pending
    </span>
  )
}

function bidStatusBadge(status: string) {
  const statusMap: Record<string, { bg: string; text: string; icon: string }> = {
    Active: {
      bg: 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200',
      text: 'text-blue-800',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z'
    },
    Complete: {
      bg: 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-200',
      text: 'text-green-800',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    Archived: {
      bg: 'bg-gradient-to-r from-slate-100 to-gray-100 border-slate-200',
      text: 'text-slate-800',
      icon: 'M5 8a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8zm5 7a1 1 0 011-1h.01a1 1 0 110 2H11a1 1 0 01-1-1z'
    },
    Hot: {
      bg: 'bg-gradient-to-r from-orange-100 to-red-100 border-orange-200',
      text: 'text-orange-800',
      icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
    },
    Cold: {
      bg: 'bg-gradient-to-r from-cyan-100 to-blue-100 border-cyan-200',
      text: 'text-cyan-800',
      icon: 'M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1z'
    }
  }

  const config = statusMap[status] || statusMap.Active

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm border ${config.bg} ${config.text}`}>
      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
      </svg>
      {status}
    </span>
  )
}

export default function BidDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bid, setBid] = React.useState<Bid | null>(null)

  React.useEffect(() => {
    getJSON<Bid>(`/bids/${id}`).then(setBid)
  }, [id])

  if (!bid) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading bid details...</p>
      </div>
    </div>
  )

  const total = bid.scopes.reduce((a, s) => a + Number(s.cost || 0), 0)
  const wonScopes = bid.scopes.filter(s => s.status === 'Won')
  const wonTotal = wonScopes.reduce((a, s) => a + Number(s.cost || 0), 0)

  const contactName = bid.contact?.name ?? '—'
  const contactEmail = bid.contact?.email || null
  const contactPhone = bid.contact?.phone || null

  return (
    <div className="space-y-6 font-sans">
      {/* Header with gradient */}
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 shadow-lg border border-blue-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full -mr-32 -mt-32 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-200 rounded-full -ml-24 -mb-24 opacity-20"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {bidStatusBadge(bid.bidStatus)}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {bid.projectName}
            </h1>
            <p className="text-slate-600 mt-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {bid.clientCompany?.name ?? '—'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to={`/bids/${bid.id}/edit`}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <button
              className="px-5 py-2.5 rounded-lg bg-slate-700 text-white font-semibold shadow-lg hover:bg-slate-800 hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              onClick={() => navigate(-1)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-green-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-200 rounded-full -mr-12 -mt-12 opacity-30"></div>
          <div className="relative">
            <div className="text-sm font-semibold text-green-700 mb-1">Total Bid Amount</div>
            <div className="text-3xl font-extrabold text-green-900">{currency(total)}</div>
          </div>
        </div>

        <div className="relative rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-blue-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full -mr-12 -mt-12 opacity-30"></div>
          <div className="relative">
            <div className="text-sm font-semibold text-blue-700 mb-1">Total Scopes</div>
            <div className="text-3xl font-extrabold text-blue-900">{bid.scopes.length}</div>
          </div>
        </div>

        <div className="relative rounded-xl bg-gradient-to-br from-purple-50 to-pink-100 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-purple-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200 rounded-full -mr-12 -mt-12 opacity-30"></div>
          <div className="relative">
            <div className="text-sm font-semibold text-purple-700 mb-1">Won Amount</div>
            <div className="text-3xl font-extrabold text-purple-900">{currency(wonTotal)}</div>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b-2 border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Bid Details</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Contact
              </div>
              <div className="text-slate-900 font-semibold">{contactName}</div>
              {contactEmail && (
                <a className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1" href={`mailto:${contactEmail}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {contactEmail}
                </a>
              )}
              {contactPhone && (
                <a className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1" href={`tel:${contactPhone}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {contactPhone}
                </a>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Proposal Date
              </div>
              <div className="text-slate-900 font-semibold">{dateFmt(bid.proposalDate)}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Due Date
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-200">
                {dateFmt(bid.dueDate)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Follow-Up Date
              </div>
              <div className="text-slate-900 font-semibold">{dateFmt(bid.followUpOn)}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Job Location
              </div>
              <div className="text-slate-900 font-semibold">{bid.jobLocation || '—'}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Lead Source
              </div>
              <div className="text-slate-900 font-semibold">{bid.leadSource || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scopes Table */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b-2 border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Scopes Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Scope Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bid.scopes.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{s.name}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-700">
                    {currency(Number(s.cost || 0))}
                  </td>
                  <td className="px-6 py-4">{statusBadge(s.status)}</td>
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-t-2 border-slate-300">
                <td className="px-6 py-4 text-sm font-bold text-slate-900">TOTAL</td>
                <td className="px-6 py-4 text-lg font-extrabold text-green-800">{currency(total)}</td>
                <td className="px-6 py-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
