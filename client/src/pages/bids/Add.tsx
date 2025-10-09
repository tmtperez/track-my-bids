// client/src/pages/bids/Add.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getJSON, postJSON } from '../../lib/api'

type Company = { id: number; name: string }
type Contact = { id: number; name: string; company?: Company }
type ScopeInput = { name: string; cost: number; status: 'Pending'|'Won'|'Lost' }
type Estimator = { id: number; name: string | null; email: string }

type BidForm = {
  projectName: string
  clientCompanyId: number | ''   // '' until selected
  contactId: number | ''         // '' until selected
  estimatorId: number | ''       // '' until selected
  proposalDate: string           // ''
  dueDate: string                // ''
  followUpOn: string             // ''  (NEW)
  jobLocation: string
  leadSource: string
  bidStatus: 'Active' | 'Complete' | 'Archived' | 'Hot' | 'Cold'
  scopes: ScopeInput[]
}

type ScopeCatalogRow = { id: number; name: string }

// Small helper: currency (optional, used for total)
const currency = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

// Reusable Combo: text filter + select (keeps dropdown, adds search)
function ComboSelect<T extends { id: number; name: string }>(props: {
  label: string
  value: number | ''
  options: T[]
  onChange: (id: number | '') => void
  placeholder?: string
}) {
  const { label, value, options, onChange, placeholder } = props
  const [q, setQ] = React.useState('')

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return options
    return options.filter(o => o.name.toLowerCase().includes(s))
  }, [q, options])

  return (
    <div>
      <label className="label">{label}</label>
      <div className="space-y-2">
        <input
          className="input"
          placeholder={placeholder ?? 'Type to search…'}
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select
          className="select"
          value={value}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Select…</option>
          {filtered.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ---------- Scope Name Combobox (type-ahead with “add if missing”) ----------
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
    props.onChange(val)
    setQuery(val)
    setOpen(false)
  }

  // Close on outside click
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
        onChange={e => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setActiveIdx(i => Math.min(i + 1, options.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIdx(i => Math.max(i - 1, -1))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            if (open) {
              if (activeIdx >= 0 && activeIdx < options.length) {
                choose(options[activeIdx])
              } else {
                const val = query.trim()
                if (!val) return
                props.onChange(val)
                if (!exists && props.onCommitNew) props.onCommitNew(val)
                setOpen(false)
              }
            } else {
              const val = query.trim()
              if (!val) return
              props.onChange(val)
              if (!exists && props.onCommitNew) props.onCommitNew(val)
            }
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        onBlur={() => {
          const val = query.trim()
          if (!val) return
          props.onChange(val)
          if (!exists && props.onCommitNew) props.onCommitNew(val)
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
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(opt)
                }}
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
                props.onChange(val)
                props.onCommitNew?.(val)
                setOpen(false)
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

export default function AddBid() {
  const navigate = useNavigate()

  const [companies, setCompanies] = React.useState<Company[]>([])
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [estimators, setEstimators] = React.useState<Estimator[]>([])

  const [saving, setSaving]   = React.useState(false)
  const [error, setError]     = React.useState<string | null>(null)

  // ⬇️ Scope catalog from API (NOT localStorage)
  const [scopeCatalog, setScopeCatalog] = React.useState<string[]>([])

  const [form, setForm] = React.useState<BidForm>({
    projectName: '',
    clientCompanyId: '',
    contactId: '',
    estimatorId: '',
    proposalDate: '',
    dueDate: '',
    followUpOn: '',
    jobLocation: '',
    leadSource: '',
    bidStatus: 'Active',
    scopes: [{ name: 'Base Scope', cost: 0, status: 'Pending' }],
  })

  React.useEffect(() => {
    // get companies + contacts once
    getJSON<Company[]>('/companies').then(cs =>
      setCompanies(cs.map(c => ({ id: c.id, name: c.name })))
    )
    getJSON<Contact[]>('/contacts').then(setContacts)
    getJSON<Estimator[]>('/users/estimators').then(setEstimators)

    // load scope catalog from server
    getJSON<ScopeCatalogRow[]>('/scopes')
      .then(rows => setScopeCatalog(rows.map(r => r.name).sort((a,b)=>a.localeCompare(b))))
      .catch(() => setScopeCatalog([]))
  }, [])

  function setField<K extends keyof BidForm>(key: K, val: BidForm[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function setScope(i: number, key: keyof ScopeInput, val: any) {
    setForm(f => ({
      ...f,
      scopes: f.scopes.map((s, idx) =>
        idx === i ? { ...s, [key]: key === 'cost' ? Number(val || 0) : val } : s
      ),
    }))
  }

  function addScope() {
    setForm(f => ({
      ...f,
      scopes: [...f.scopes, { name: '', cost: 0, status: 'Pending' }],
    }))
  }

  function removeScope(i: number) {
    setForm(f => ({ ...f, scopes: f.scopes.filter((_, idx) => idx !== i) }))
  }

  // ⬇️ create missing scope in catalog via API
  async function addToCatalogIfMissing(name: string) {
    const val = name.trim()
    if (!val) return
    if (scopeCatalog.some(s => s.toLowerCase() === val.toLowerCase())) return
    try {
      await postJSON('/scopes', { name: val })
      setScopeCatalog(prev => [...prev, val].sort((a,b)=>a.localeCompare(b)))
    } catch {
      // silently ignore for now; could add a toast
    }
  }

  // Filter contacts by selected company if one is chosen
  const visibleContacts = React.useMemo(() => {
    if (!form.clientCompanyId) return contacts
    return contacts.filter(c => c.company?.id === form.clientCompanyId)
  }, [contacts, form.clientCompanyId])

  const total = form.scopes.reduce((a, s) => a + Number(s.cost || 0), 0)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        projectName: form.projectName.trim(),
        clientCompanyId: Number(form.clientCompanyId),
        contactId: form.contactId ? Number(form.contactId) : null,
        estimatorId: form.estimatorId ? Number(form.estimatorId) : null,
        proposalDate: form.proposalDate || null,
        dueDate: form.dueDate || null,
        followUpOn: form.followUpOn || null,
        jobLocation: form.jobLocation || null,
        leadSource: form.leadSource || null,
        bidStatus: form.bidStatus,
        scopes: form.scopes.map(s => ({
          name: s.name.trim(),
          cost: Number(s.cost || 0),
          status: s.status,
        })),
      }

      if (!payload.clientCompanyId) {
        throw new Error('Please select a client company.')
      }

      await postJSON('/bids', payload)
      navigate('/bids')
    } catch (err: any) {
      setError(err?.message || 'Failed to create bid')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto font-sans">
      {/* Modern Header */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl blur-xl opacity-20"></div>
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Create New Bid</h1>
              <p className="text-emerald-50 text-sm mt-1">Fill in the details to create a new project bid</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-200 space-y-8 p-8">
        {/* Project Details Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Project Information</h2>
          </div>

          <div>
            <label className="label font-semibold text-slate-700">Project Name *</label>
            <input
              className="input focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={form.projectName}
              onChange={e => setField('projectName', e.target.value)}
              placeholder="Enter project name..."
              required
            />
          </div>
        </div>

        {/* Client Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Client Details</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="Client Company"
            value={form.clientCompanyId}
            options={companies}
            onChange={(v) => {
              setField('clientCompanyId', v)
              setField('contactId', '')
            }}
            placeholder="Search company…"
          />
          <ComboSelect
            label="Contact Person"
            value={form.contactId}
            options={visibleContacts.map(c => ({
              id: c.id,
              name: `${c.name} (${c.company?.name ?? '—'})`,
            }))}
            onChange={(v) => setField('contactId', v)}
            placeholder="Search contact…"
          />
          </div>

          {/* Estimator */}
          <div>
            <label className="label font-semibold text-slate-700">Estimator</label>
            <select
              className="select focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              value={form.estimatorId}
              onChange={e => setField('estimatorId', e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select estimator…</option>
              {estimators.map(est => (
                <option key={est.id} value={est.id}>
                  {est.name || est.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Timeline & Dates</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="label font-semibold text-slate-700">Proposal Date</label>
              <input
                className="input focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                type="date"
                value={form.proposalDate}
                onChange={e => setField('proposalDate', e.target.value)}
              />
            </div>
            <div>
              <label className="label font-semibold text-slate-700">Due Date</label>
              <input
                className="input focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                type="date"
                value={form.dueDate}
                onChange={e => setField('dueDate', e.target.value)}
              />
            </div>
            <div>
              <label className="label font-semibold text-slate-700">Follow-up In</label>
              <input
                className="input focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                type="date"
                value={form.followUpOn}
                onChange={e => setField('followUpOn', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label font-semibold text-slate-700">Job Location</label>
              <input
                className="input focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                value={form.jobLocation}
                onChange={e => setField('jobLocation', e.target.value)}
                placeholder="Enter job location..."
              />
            </div>
            <div>
              <label className="label font-semibold text-slate-700">Lead Source</label>
              <input
                className="input focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                value={form.leadSource}
                onChange={e => setField('leadSource', e.target.value)}
                placeholder="Enter lead source..."
              />
            </div>
          </div>

          <div>
            <label className="label font-semibold text-slate-700">Bid Status</label>
            <select
              className="select focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              value={form.bidStatus}
              onChange={e => setField('bidStatus', e.target.value as BidForm['bidStatus'])}
            >
              <option>Active</option>
              <option>Hot</option>
              <option>Cold</option>
              <option>Complete</option>
              <option>Archived</option>
            </select>
          </div>
        </div>

        {/* Scopes Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Scope Breakdown</h2>
          </div>
          <div className="space-y-3">
            {form.scopes.map((s, i) => (
              <div key={i} className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200 hover:border-emerald-300 transition-all">
                <div className="grid grid-cols-12 items-center gap-3">
                  <div className="col-span-12 md:col-span-5">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Scope Name</label>
                    <ScopeNameCombo
                      value={s.name}
                      catalog={scopeCatalog}
                      onChange={(val) => setScope(i, 'name', val)}
                      onCommitNew={(val) => addToCatalogIfMissing(val)}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Cost</label>
                    <input
                      className="input focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="$0"
                      value={s.cost}
                      onChange={e => setScope(i, 'cost', e.target.value)}
                    />
                  </div>
                  <div className="col-span-5 md:col-span-3">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Status</label>
                    <select
                      className="select focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      value={s.status}
                      onChange={e => setScope(i, 'status', e.target.value)}
                    >
                      <option>Pending</option>
                      <option>Won</option>
                      <option>Lost</option>
                    </select>
                  </div>
                  <div className="col-span-1 flex items-end justify-center">
                    <button
                      type="button"
                      className="w-10 h-10 rounded-lg bg-rose-100 border border-rose-300 text-rose-600 hover:bg-rose-200 hover:scale-110 transition-all duration-200 flex items-center justify-center font-bold text-xl"
                      onClick={() => removeScope(i)}
                      title="Remove scope"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="group w-full rounded-lg border-2 border-dashed border-emerald-300 px-4 py-3 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            onClick={addScope}
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Scope
          </button>

          {/* Total Display */}
          <div className="mt-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-emerald-100">Total Bid Value</div>
                  <div className="text-3xl font-bold">{currency(total)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-emerald-100">Scopes</div>
                <div className="text-2xl font-bold">{form.scopes.length}</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-6 h-6 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-rose-700 font-medium">{error}</div>
          </div>
        )}

        <div className="flex gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            className="flex-1 group relative px-6 py-3 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 overflow-hidden"
            onClick={() => history.back()}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            <span className="relative flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </span>
          </button>
          <button
            type="submit"
            className="flex-1 group relative px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold shadow-lg hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-200 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={saving}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <span className="relative flex items-center justify-center gap-2">
              {saving ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating Bid...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Bid
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  )
}
