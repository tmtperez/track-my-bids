// client/src/pages/bids/Add.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getJSON, postJSON } from '../../lib/api'

type Company = { id: number; name: string }
type Contact = { id: number; name: string; company?: Company }
type ScopeInput = { name: string; cost: number; status: 'Pending'|'Won'|'Lost' }

type BidForm = {
  projectName: string
  clientCompanyId: number | ''   // '' until selected
  contactId: number | ''         // '' until selected
  proposalDate: string           // ''
  dueDate: string                // ''
  jobLocation: string
  leadSource: string
  bidStatus: 'Active' | 'Complete' | 'Archived'
  scopes: ScopeInput[]
}

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

export default function AddBid() {
  const navigate = useNavigate()

  const [companies, setCompanies] = React.useState<Company[]>([])
  const [contacts, setContacts] = React.useState<Contact[]>([])

  const [saving, setSaving]   = React.useState(false)
  const [error, setError]     = React.useState<string | null>(null)

  const [form, setForm] = React.useState<BidForm>({
    projectName: '',
    clientCompanyId: '',
    contactId: '',
    proposalDate: '',
    dueDate: '',
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
        clientCompanyId: Number(form.clientCompanyId),               // must be number
        contactId: form.contactId ? Number(form.contactId) : null,   // null or number
        proposalDate: form.proposalDate || null,
        dueDate: form.dueDate || null,
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
    <div className="max-w-3xl font-sans">
      <div className="mb-4 text-2xl font-extrabold tracking-tight">Add Bid</div>

      <form onSubmit={onSubmit} className="card space-y-5 p-5">
        <div>
          <label className="label">Project Name</label>
          <input
            className="input"
            value={form.projectName}
            onChange={e => setField('projectName', e.target.value)}
            required
          />
        </div>

        {/* Company + Contact (searchable combos like Edit) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="Client Company"
            value={form.clientCompanyId}
            options={companies}
            onChange={(v) => {
              // if company changes and existing contact doesn't belong, clear contact
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">Proposal Date</label>
            <input
              className="input"
              type="date"
              value={form.proposalDate}
              onChange={e => setField('proposalDate', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input
              className="input"
              type="date"
              value={form.dueDate}
              onChange={e => setField('dueDate', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">Job Location</label>
            <input
              className="input"
              value={form.jobLocation}
              onChange={e => setField('jobLocation', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Lead Source</label>
            <input
              className="input"
              value={form.leadSource}
              onChange={e => setField('leadSource', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Bid Status</label>
          <select
            className="select"
            value={form.bidStatus}
            onChange={e => setField('bidStatus', e.target.value as BidForm['bidStatus'])}
          >
            <option>Active</option>
            <option>Complete</option>
            <option>Archived</option>
          </select>
        </div>

        {/* Scopes */}
        <div className="pt-2">
          <div className="mb-2 font-medium">Scope Breakdown</div>
          {form.scopes.map((s, i) => (
            <div key={i} className="mb-2 grid grid-cols-12 items-center gap-2">
              <input
                className="input col-span-5 md:col-span-5"
                placeholder="Scope Name"
                value={s.name}
                onChange={e => setScope(i, 'name', e.target.value)}
              />
              <input
                className="input col-span-3 md:col-span-3"
                type="number"
                min={0}
                step={1}
                placeholder="Cost"
                value={s.cost}
                onChange={e => setScope(i, 'cost', e.target.value)}
              />
              <select
                className="select col-span-3 md:col-span-3"
                value={s.status}
                onChange={e => setScope(i, 'status', e.target.value)}
              >
                <option>Pending</option>
                <option>Won</option>
                <option>Lost</option>
              </select>
              <button
                type="button"
                className="col-span-1 rounded-lg border border-rose-300 px-2 py-1 text-rose-600 hover:bg-rose-50"
                onClick={() => removeScope(i)}
                title="Remove scope"
              >
                −
              </button>
            </div>
          ))}
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            onClick={addScope}
          >
            + Add scope
          </button>
        </div>

        <div className="pt-2 text-right text-lg font-semibold">
          Total: {currency(total)}
        </div>

        {error && <div className="text-rose-600 text-sm">{error}</div>}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="rounded-lg bg-rose-600 px-4 py-2 text-white shadow hover:bg-rose-700"
            onClick={() => history.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-700"
            disabled={saving}
          >
            {saving ? 'Creating…' : 'Create Bid'}
          </button>
        </div>
      </form>
    </div>
  )
}
