import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getJSON, putJSON, postJSON } from '../../lib/api'

type Company = { id: number; name: string }
type Contact = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
}
type Estimator = { id: number; name: string | null; email: string }
type Scope = { name: string; cost: number; status: 'Pending' | 'Won' | 'Lost' }
type BidStatus = 'Active' | 'Complete' | 'Archived' | 'Hot' | 'Cold'
type Bid = {
  id: number
  projectName: string
  clientCompany: Company
  contact?: Contact | null
  estimator?: Estimator | null
  proposalDate?: string | null
  dueDate?: string | null
  followUpOn?: string | null
  jobLocation?: string | null
  leadSource?: string | null
  bidStatus: BidStatus
  scopes: Scope[]
}

type ScopeCatalogRow = { id: number; name: string }

/* ----------------------- helpers ----------------------- */
const currency = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const dateToInput = (d?: string | null) => (d ? d.slice(0, 10) : '')

const inputToISO = (v: string) => (v ? `${v}T00:00:00Z` : null)

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

/* ---------------- scope combobox (unchanged UI) --------------- */
function ScopeNameCombo(props: {
  value: string
  onChange: (val: string) => void
  onCommitNew?: (val: string) => void
  catalog: string[]
}) {
  const { value, onChange, onCommitNew, catalog } = props
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState(value ?? '')
  const [activeIdx, setActiveIdx] = React.useState<number>(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => setQuery(value ?? ''), [value])

  const options = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter(s => s.toLowerCase().includes(q))
  }, [query, catalog])

  const exists = React.useMemo(
    () => catalog.some(s => s.toLowerCase() === query.trim().toLowerCase()),
    [catalog, query]
  )

  function choose(val: string) {
    onChange(val)
    setQuery(val)
    setOpen(false)
  }

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <input
        className="input w-full"
        placeholder="Scope Name"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActiveIdx(i => Math.min(i + 1, options.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
          else if (e.key === 'Enter') {
            e.preventDefault()
            if (open) {
              if (activeIdx >= 0 && activeIdx < options.length) choose(options[activeIdx])
              else {
                const val = query.trim(); if (!val) return
                onChange(val); if (!exists && onCommitNew) onCommitNew(val); setOpen(false)
              }
            } else {
              const val = query.trim(); if (!val) return
              onChange(val); if (!exists && onCommitNew) onCommitNew(val)
            }
          } else if (e.key === 'Escape') { setOpen(false) }
        }}
        onBlur={() => {
          const val = query.trim(); if (!val) return
          onChange(val); if (!exists && onCommitNew) onCommitNew(val)
        }}
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow">
          {options.length > 0 ? (
            options.map((opt, idx) => (
              <div
                key={opt}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-slate-50 ${idx === activeIdx ? 'bg-slate-50' : ''}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={(e) => { e.preventDefault(); choose(opt) }}
              >
                {opt}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
          )}
          {!exists && query.trim() && (
            <div
              className="border-t px-3 py-2 text-sm text-emerald-700 cursor-pointer hover:bg-emerald-50"
              onMouseDown={(e) => {
                e.preventDefault()
                const val = query.trim()
                onChange(val); onCommitNew?.(val); setOpen(false)
              }}
            >
              + Add “{query.trim()}”
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* --------------------- MAIN --------------------- */
export default function BidEdit() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [bid, setBid] = React.useState<Bid | null>(null)

  // editable form state (besides scopes)
  const [edit, setEdit] = React.useState<{
    projectName: string
    clientCompanyId: number | null
    contactId: number | null
    estimatorId: number | null
    proposalDate: string
    dueDate: string
    followUpOn: string
    jobLocation: string
    leadSource: string
    bidStatus: BidStatus
  } | null>(null)

  // ⬇️ Catalog from API, not localStorage
  const [scopeCatalog, setScopeCatalog] = React.useState<string[]>([])
  const [editScopes, setEditScopes] = React.useState<Scope[]>([])

  // picklists
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [estimators, setEstimators] = React.useState<Estimator[]>([])

  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    getJSON<Bid>(`/bids/${id}`).then((b) => {
      setBid(b)
      setEdit({
        projectName: b.projectName,
        clientCompanyId: b.clientCompany?.id ?? null,
        contactId: b.contact?.id ?? null,
        estimatorId: b.estimator?.id ?? null,
        proposalDate: dateToInput(b.proposalDate),
        dueDate: dateToInput(b.dueDate),
        followUpOn: dateToInput(b.followUpOn),
        jobLocation: b.jobLocation ?? '',
        leadSource: b.leadSource ?? '',
        bidStatus: b.bidStatus,
      })
      setEditScopes(b.scopes?.map(s => ({ ...s })) ?? [])
    })
  }, [id])

  // load companies (best-effort)
  React.useEffect(() => {
    getJSON<Company[]>('/companies').then(setCompanies).catch(() => {})
    getJSON<Estimator[]>('/users/estimators').then(setEstimators).catch(() => {})
  }, [])

  // load contacts when company changes (best-effort)
  React.useEffect(() => {
    if (!edit?.clientCompanyId) { setContacts([]); return }
    getJSON<Contact[]>(`/contacts?companyId=${edit.clientCompanyId}`).then(setContacts).catch(() => {})
  }, [edit?.clientCompanyId])

  // ⬇️ Load scope catalog from server
  React.useEffect(() => {
    getJSON<ScopeCatalogRow[]>('/scopes')
      .then(rows => setScopeCatalog(rows.map(r => r.name).sort((a,b)=>a.localeCompare(b))))
      .catch(() => setScopeCatalog([]))
  }, [])

  // ⬇️ Add to catalog on server if missing
  async function addToCatalogIfMissing(name: string) {
    const val = (name || '').trim()
    if (!val) return
    if (scopeCatalog.some(s => s.toLowerCase() === val.toLowerCase())) return
    try {
      await postJSON('/scopes', { name: val })
      setScopeCatalog(prev => [...prev, val].sort((a,b)=>a.localeCompare(b)))
    } catch {
      // optional toast
    }
  }

  function setScope(i: number, key: keyof Scope, val: any) {
    setEditScopes(scopes =>
      scopes.map((s, idx) =>
        idx === i ? { ...s, [key]: key === 'cost' ? Number(val || 0) : val } : s
      )
    )
  }
  function addScopeRow() {
    setEditScopes(scopes => [...scopes, { name: '', cost: 0, status: 'Pending' }])
  }
  function removeScopeRow(i: number) {
    setEditScopes(scopes => scopes.filter((_, idx) => idx !== i))
  }

  async function saveAll() {
    if (!bid || !edit) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        projectName: edit.projectName.trim(),
        clientCompanyId: edit.clientCompanyId ?? bid.clientCompany?.id ?? null,
        contactId: edit.contactId ?? null,
        estimatorId: edit.estimatorId ?? null,
        proposalDate: edit.proposalDate ? inputToISO(edit.proposalDate) : null,
        dueDate: edit.dueDate ? inputToISO(edit.dueDate) : null,
        followUpOn: edit.followUpOn ? inputToISO(edit.followUpOn) : null,
        jobLocation: edit.jobLocation || null,
        leadSource: edit.leadSource || null,
        bidStatus: edit.bidStatus,
        scopes: editScopes.map(s => ({
          name: (s.name || '').trim(),
          cost: Number(s.cost || 0),
          status: s.status,
        })),
      }
      await putJSON(`/bids/${bid.id}`, payload)
      const refreshed = await getJSON<Bid>(`/bids/${bid.id}`)
      setBid(refreshed)
      setEdit({
        projectName: refreshed.projectName,
        clientCompanyId: refreshed.clientCompany?.id ?? null,
        contactId: refreshed.contact?.id ?? null,
        estimatorId: refreshed.estimator?.id ?? null,
        proposalDate: dateToInput(refreshed.proposalDate),
        dueDate: dateToInput(refreshed.dueDate),
        followUpOn: dateToInput(refreshed.followUpOn),
        jobLocation: refreshed.jobLocation ?? '',
        leadSource: refreshed.leadSource ?? '',
        bidStatus: refreshed.bidStatus,
      })
      setEditScopes(refreshed.scopes?.map(s => ({ ...s })) ?? [])
    } catch (e: any) {
      setError(e?.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (!bid || !edit) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading bid details...</p>
      </div>
    </div>
  )

  const total = editScopes.reduce((a, s) => a + Number(s.cost || 0), 0)

  return (
    <div className="space-y-6 font-sans">
      {/* Header with gradient */}
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 shadow-lg border border-blue-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full -mr-32 -mt-32 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-200 rounded-full -ml-24 -mb-24 opacity-20"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Bid
            </h1>
            <p className="text-slate-600 mt-2">{bid.projectName}</p>
          </div>
          <div className="flex gap-3">
            <Link
              to={`/bids/${bid.id}`}
              className="px-5 py-2.5 rounded-lg bg-white border-2 border-slate-300 text-slate-700 font-semibold shadow-md hover:shadow-lg hover:border-slate-400 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
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

      {/* === Bid Info Form === */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b-2 border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Bid Information
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

          <label className="space-y-1">
            <span className="text-xs font-semibold tracking-widest text-slate-500">PROJECT NAME</span>
            <input className="input w-full" value={edit.projectName}
              onChange={e => setEdit(v => v ? { ...v, projectName: e.target.value } : v)} />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold tracking-widest text-slate-500">COMPANY</span>
            {companies.length > 0 ? (
              <select
                className="select w-full"
                value={edit.clientCompanyId ?? ''}
                onChange={(e) => setEdit(v => v ? { ...v, clientCompanyId: e.target.value ? Number(e.target.value) : null, contactId: null } : v)}
              >
                <option value="">— Select company —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <input
                className="input w-full"
                placeholder="Company ID (no /companies endpoint)"
                value={edit.clientCompanyId ?? ''}
                onChange={(e) => setEdit(v => v ? { ...v, clientCompanyId: e.target.value ? Number(e.target.value) : null, contactId: null } : v)}
              />
            )}
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold tracking-widest text-slate-500">CONTACT</span>
            {contacts.length > 0 ? (
              <select
                className="select w-full"
                value={edit.contactId ?? ''}
                onChange={(e) => setEdit(v => v ? { ...v, contactId: e.target.value ? Number(e.target.value) : null } : v)}
              >
                <option value="">— Select contact —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <input
                className="input w-full"
                placeholder="Contact ID (no /contacts endpoint)"
                value={edit.contactId ?? ''}
                onChange={(e) => setEdit(v => v ? { ...v, contactId: e.target.value ? Number(e.target.value) : null } : v)}
              />
            )}
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold tracking-widest text-slate-500">ESTIMATOR</span>
            <select
              className="select w-full"
              value={edit.estimatorId ?? ''}
              onChange={(e) => setEdit(v => v ? { ...v, estimatorId: e.target.value ? Number(e.target.value) : null } : v)}
            >
              <option value="">— Select estimator —</option>
              {estimators.map(est => <option key={est.id} value={est.id}>{est.name || est.email}</option>)}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold tracking-widest text-slate-500">PROPOSAL DATE</span>
            <input type="date" className="input w-full" value={edit.proposalDate}
              onChange={e => setEdit(v => v ? { ...v, proposalDate: e.target.value } : v)} />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold tracking-widest text-slate-500">DUE DATE</span>
            <input type="date" className="input w-full" value={edit.dueDate}
              onChange={e => setEdit(v => v ? { ...v, dueDate: e.target.value } : v)} />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold tracking-widest text-slate-500">FOLLOW-UP ON</span>
            <input type="date" className="input w-full" value={edit.followUpOn}
              onChange={e => setEdit(v => v ? { ...v, followUpOn: e.target.value } : v)} />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold tracking-widest text-slate-500">JOB LOCATION</span>
            <input className="input w-full" value={edit.jobLocation}
              onChange={e => setEdit(v => v ? { ...v, jobLocation: e.target.value } : v)} />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold tracking-widest text-slate-500">LEAD SOURCE</span>
            <input className="input w-full" value={edit.leadSource}
              onChange={e => setEdit(v => v ? { ...v, leadSource: e.target.value } : v)} />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold tracking-widest text-slate-500">BID STATUS</span>
            <select
              className="select w-full"
              value={edit.bidStatus}
              onChange={e => setEdit(v => v ? { ...v, bidStatus: e.target.value as BidStatus } : v)}
            >
              <option>Active</option>
              <option>Complete</option>
              <option>Archived</option>
              <option>Hot</option>
              <option>Cold</option>
            </select>
          </label>
        </div>
        </div>
      </div>

      {/* === Summary Stats === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-blue-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full -mr-12 -mt-12 opacity-30"></div>
          <div className="relative">
            <div className="text-sm font-semibold text-blue-700 mb-1">Client Company</div>
            <div className="text-2xl font-extrabold text-blue-900">{bid.clientCompany?.name ?? '—'}</div>
          </div>
        </div>

        <div className="relative rounded-xl bg-gradient-to-br from-purple-50 to-pink-100 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-purple-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200 rounded-full -mr-12 -mt-12 opacity-30"></div>
          <div className="relative">
            <div className="text-sm font-semibold text-purple-700 mb-1">Bid Status</div>
            <div className="text-lg font-bold text-purple-900">{edit.bidStatus}</div>
          </div>
        </div>

        <div className="relative rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-green-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-200 rounded-full -mr-12 -mt-12 opacity-30"></div>
          <div className="relative">
            <div className="text-sm font-semibold text-green-700 mb-1">Total Amount</div>
            <div className="text-3xl font-extrabold text-green-900">{currency(total)}</div>
          </div>
        </div>
      </div>

      {/* === Read-only scopes table === */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b-2 border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Current Scopes
          </h2>
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
                  <td className="px-6 py-4 text-sm font-semibold text-green-700">{currency(Number(s.cost || 0))}</td>
                  <td className="px-6 py-4">{statusBadge(s.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* === Editable scopes === */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-100 px-6 py-4 border-b-2 border-emerald-200">
          <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Scopes
          </h2>
        </div>
        <div className="p-6">

        {editScopes.map((s, i) => (
          <div key={i} className="mb-2 grid grid-cols-12 items-center gap-2">
            <div className="col-span-5 md:col-span-5">
              <ScopeNameCombo
                value={s.name}
                catalog={scopeCatalog}
                onChange={(val) => setScope(i, 'name', val)}
                onCommitNew={(val) => addToCatalogIfMissing(val)}
              />
            </div>
            <input
              className="input col-span-3 md:col-span-3"
              type="number" min={0} step={1} placeholder="Cost"
              value={s.cost}
              onChange={e => setScope(i, 'cost', e.target.value)}
            />
            <select
              className="select col-span-3 md:col-span-3"
              value={s.status}
              onChange={e => setScope(i, 'status', e.target.value as Scope['status'])}
            >
              <option>Pending</option>
              <option>Won</option>
              <option>Lost</option>
            </select>
            <button
              type="button"
              className="col-span-1 rounded-lg border border-rose-300 px-2 py-1 text-rose-600 hover:bg-rose-50"
              onClick={() => removeScopeRow(i)}
              title="Remove scope"
            >−</button>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border-2 border-emerald-300 text-emerald-700 font-semibold hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-200 flex items-center gap-2"
            onClick={addScopeRow}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Scope
          </button>

          <div className="flex-1"></div>

          {error && (
            <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="button"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            onClick={saveAll}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
