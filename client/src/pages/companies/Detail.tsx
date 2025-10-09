import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getJSON, postJSON, delJSON, uploadFile } from '../../lib/api'

type Contact = {
  id: number
  name: string
  title?: string | null
  email?: string | null
  phone?: string | null
  isPrimary: boolean
}

type AccountManager = {
  id: number
  name: string | null
  email: string
}

type Tag = {
  id: number
  tagName: string
  createdAt: string
}

type Attachment = {
  id: number
  originalName: string
  path: string
  mimetype?: string | null
  size?: number | null
  uploadedBy?: string | null
  createdAt: string
}

type ActivityLog = {
  id: number
  activityType: string
  description: string
  performedBy?: string | null
  createdAt: string
}

type Company = {
  id: number
  name: string
  website?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  accountManager?: AccountManager | null
  relationshipStatus?: string | null
  customerSince?: string | null
  lastContactDate?: string | null
  nextFollowUpDate?: string | null
  notes?: string | null
  contacts: Contact[]
  companyTags: Tag[]
  companyAttachments: Attachment[]
  activityLogs: ActivityLog[]
  won: number
  lost: number
  totalBidValue: number
  avgProjectSize: number
  activeBids: number
  totalProjects: number
}

const currency = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const dateFmt = (d?: string | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : '—'

export default function CompanyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = React.useState<Company | null>(null)
  const [newTag, setNewTag] = React.useState('')
  const [newActivity, setNewActivity] = React.useState({ type: 'note', description: '' })

  React.useEffect(() => {
    loadCompany()
  }, [id])

  function loadCompany() {
    getJSON<Company>(`/companies/${id}`).then(setCompany)
  }

  async function addTag() {
    if (!newTag.trim()) return
    await postJSON(`/companies/${id}/tags`, { tagName: newTag.trim() })
    setNewTag('')
    loadCompany()
  }

  async function removeTag(tagId: number) {
    await delJSON(`/companies/${id}/tags/${tagId}`)
    loadCompany()
  }

  async function addActivityLog() {
    if (!newActivity.description.trim()) return
    await postJSON(`/companies/${id}/activity`, {
      activityType: newActivity.type,
      description: newActivity.description.trim(),
    })
    setNewActivity({ type: 'note', description: '' })
    loadCompany()
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(`/companies/${id}/attachments`, file)
    loadCompany()
  }

  async function removeAttachment(attachmentId: number) {
    if (!confirm('Delete this attachment?')) return
    await delJSON(`/companies/${id}/attachments/${attachmentId}`)
    loadCompany()
  }

  if (!company) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading company details...</p>
      </div>
    </div>
  )

  const total = company.won + company.lost
  const winRate = total > 0 ? (company.won / total) * 100 : 0

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    prospect: 'bg-blue-100 text-blue-800 border-blue-200',
  }

  const statusColor = statusColors[company.relationshipStatus?.toLowerCase() || ''] || 'bg-slate-100 text-slate-800 border-slate-200'

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 p-8 shadow-lg border border-emerald-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200 rounded-full -mr-32 -mt-32 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-200 rounded-full -ml-24 -mb-24 opacity-20"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {company.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {company.name}
                </h1>
                {company.city && company.state && (
                  <p className="text-slate-600 mt-1">{company.city}, {company.state}</p>
                )}
              </div>
            </div>
            {company.relationshipStatus && (
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${statusColor}`}>
                {company.relationshipStatus.charAt(0).toUpperCase() + company.relationshipStatus.slice(1)}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              to={`/companies/${company.id}/edit`}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-blue-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full -mr-12 -mt-12 opacity-30"></div>
          <div className="relative">
            <div className="text-sm font-semibold text-blue-700 mb-1">Active Bids</div>
            <div className="text-3xl font-extrabold text-blue-900">{company.activeBids}</div>
          </div>
        </div>

        <div className="relative rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-green-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-200 rounded-full -mr-12 -mt-12 opacity-30"></div>
          <div className="relative">
            <div className="text-sm font-semibold text-green-700 mb-1">Total Won</div>
            <div className="text-3xl font-extrabold text-green-900">{currency(company.won)}</div>
          </div>
        </div>

        <div className="relative rounded-xl bg-gradient-to-br from-purple-50 to-pink-100 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-purple-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200 rounded-full -mr-12 -mt-12 opacity-30"></div>
          <div className="relative">
            <div className="text-sm font-semibold text-purple-700 mb-1">Avg Project Size</div>
            <div className="text-3xl font-extrabold text-purple-900">{currency(company.avgProjectSize)}</div>
          </div>
        </div>

        <div className="relative rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-amber-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200 rounded-full -mr-12 -mt-12 opacity-30"></div>
          <div className="relative">
            <div className="text-sm font-semibold text-amber-700 mb-1">Win Rate</div>
            <div className="text-3xl font-extrabold text-amber-900">{total > 0 ? `${winRate.toFixed(0)}%` : '—'}</div>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b-2 border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Company Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Website
              </div>
              {company.website ? (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline font-semibold">
                  {company.website}
                </a>
              ) : (
                <div className="text-slate-400">—</div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Address
              </div>
              <div className="text-slate-900 font-semibold">
                {company.address ? (
                  <>
                    <div>{company.address}</div>
                    {(company.city || company.state || company.zip) && (
                      <div>{[company.city, company.state, company.zip].filter(Boolean).join(', ')}</div>
                    )}
                  </>
                ) : '—'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account Manager
              </div>
              {company.accountManager ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                    {(company.accountManager.name || company.accountManager.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-900">{company.accountManager.name || company.accountManager.email}</span>
                </div>
              ) : (
                <div className="text-slate-400">—</div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Customer Since
              </div>
              <div className="text-slate-900 font-semibold">{dateFmt(company.customerSince)}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Last Contact
              </div>
              <div className="text-slate-900 font-semibold">{dateFmt(company.lastContactDate)}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Next Follow-Up
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                {dateFmt(company.nextFollowUpDate)}
              </div>
            </div>
          </div>

          {company.notes && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Notes
              </div>
              <p className="text-slate-700 whitespace-pre-wrap">{company.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b-2 border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Contacts ({company.contacts.length})
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.contacts.map(contact => (
              <div key={contact.id} className="p-4 rounded-lg border-2 border-slate-200 hover:border-emerald-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-slate-900">{contact.name}</div>
                      {contact.isPrimary && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                          Primary
                        </span>
                      )}
                    </div>
                    {contact.title && <div className="text-sm text-slate-600">{contact.title}</div>}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline block mt-1">
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="text-sm text-blue-600 hover:underline block mt-1">
                        {contact.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {company.contacts.length === 0 && (
              <div className="text-slate-500 text-center py-8 col-span-2">No contacts added yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-100 px-6 py-4 border-b-2 border-purple-200">
          <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tags
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {company.companyTags.map(tag => (
              <span key={tag.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                {tag.tagName}
                <button onClick={() => removeTag(tag.id)} className="hover:text-purple-900">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Add new tag..."
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addTag()}
            />
            <button
              onClick={addTag}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
            >
              Add Tag
            </button>
          </div>
        </div>
      </div>

      {/* Attachments */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 px-6 py-4 border-b-2 border-blue-200">
          <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Attachments ({company.companyAttachments.length})
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-2 mb-4">
            {company.companyAttachments.map(att => (
              <div key={att.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <div className="font-medium text-slate-900">{att.originalName}</div>
                    <div className="text-xs text-slate-500">
                      Uploaded by {att.uploadedBy || 'Unknown'} on {new Date(att.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          <label className="cursor-pointer px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors inline-block">
            <input type="file" className="hidden" onChange={handleFileUpload} />
            Upload Attachment
          </label>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-100 px-6 py-4 border-b-2 border-amber-200">
          <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Activity Log
          </h2>
        </div>
        <div className="p-6">
          <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex gap-2 mb-2">
              <select
                className="input w-40"
                value={newActivity.type}
                onChange={e => setNewActivity({ ...newActivity, type: e.target.value })}
              >
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="email">Email</option>
                <option value="update">Update</option>
              </select>
            </div>
            <textarea
              className="input w-full"
              rows={3}
              placeholder="Add activity description..."
              value={newActivity.description}
              onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
            />
            <button
              onClick={addActivityLog}
              className="mt-2 px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
            >
              Add Activity
            </button>
          </div>

          <div className="space-y-3">
            {company.activityLogs.map(log => (
              <div key={log.id} className="p-4 rounded-lg border-l-4 border-amber-400 bg-amber-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-200 text-amber-900">
                        {log.activityType}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()} by {log.performedBy || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-slate-700">{log.description}</p>
                  </div>
                </div>
              </div>
            ))}
            {company.activityLogs.length === 0 && (
              <div className="text-slate-500 text-center py-8">No activity logged yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
