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
  jobLocation?: string | null
  leadSource?: string | null
  bidStatus: 'Active' | 'Complete' | 'Archived'
  scopes: Scope[]
}

const currency = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const dateFmt = (d?: string | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : '—'

function statusBadge(s: 'Pending' | 'Won' | 'Lost') {
  const base =
    'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold'
  if (s === 'Won')
    return (
      <span className={`${base} bg-emerald-100 text-emerald-700`}>Won</span>
    )
  if (s === 'Lost')
    return (
      <span className={`${base} bg-rose-100 text-rose-700`}>Lost</span>
    )
  return <span className={`${base} bg-amber-100 text-amber-700`}>Pending</span>
}

function pillBadge(text: string, tone: 'blue' | 'slate' = 'slate') {
  const map: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    slate: 'bg-slate-100 text-slate-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${map[tone]}`}
    >
      {text}
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

  if (!bid) return <div>Loading…</div>

  const total = bid.scopes.reduce((a, s) => a + Number(s.cost || 0), 0)

  const contactName = bid.contact?.name ?? '—'
  const contactEmail = bid.contact?.email || null
  const contactPhone = bid.contact?.phone || null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {bid.projectName}
        </h1>
        <div className="flex gap-2">
          <Link
            to={`/bids/${bid.id}/edit`}
            className="rounded-lg bg-blue-600 px-3 py-2 text-white shadow hover:bg-blue-700"
          >
            Edit
          </Link>
          <button
            className="rounded-lg bg-slate-900 px-3 py-2 text-white shadow hover:bg-slate-800"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-xl bg-white p-6 shadow-soft ring-1 ring-black/5">
        {/* 4 columns on lg, 2 on md, 1 on small — uniform spacing */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              CLIENT
            </div>
            <div className="text-slate-900">
              {bid.clientCompany?.name ?? '—'}
            </div>
          </div>

          {/* CONTACT (with email + phone) */}
          <div className="space-y-1">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              CONTACT
            </div>
            <div className="text-slate-900">{contactName}</div>
            <div className="text-sm text-slate-600">
              {contactEmail ? (
                <a className="hover:underline" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
              ) : (
                '—'
              )}
            </div>
            <div className="text-sm text-slate-600">
              {contactPhone ? (
                <a className="hover:underline" href={`tel:${contactPhone}`}>
                  {contactPhone}
                </a>
              ) : (
                '—'
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              PROPOSAL DATE
            </div>
            <div className="text-slate-900">{dateFmt(bid.proposalDate)}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              DUE DATE
            </div>
            <div className="text-rose-600">{dateFmt(bid.dueDate)}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              JOB LOCATION
            </div>
            <div className="text-slate-900">{bid.jobLocation || '—'}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              LEAD SOURCE
            </div>
            <div className="text-slate-900">{bid.leadSource || '—'}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              BID STATUS
            </div>
            {pillBadge(bid.bidStatus, 'slate')}
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              TOTAL AMOUNT
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-slate-900">
              {currency(total)}
            </div>
          </div>
        </div>
      </div>

      {/* Scopes */}
      <div className="rounded-xl bg-white p-6 shadow-soft ring-1 ring-black/5">
        <div className="mb-3 text-lg font-semibold">Scopes</div>
        <div className="-mx-4 overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-slate-500">
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium w-48">Cost</th>
                <th className="px-4 py-3 font-medium w-40">Status</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {bid.scopes.map((s, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">
                    {currency(Number(s.cost || 0))}
                  </td>
                  <td className="px-4 py-3">{statusBadge(s.status)}</td>
                </tr>
              ))}
              <tr className="border-t font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3">{currency(total)}</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
