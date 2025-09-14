import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getJSON, putJSON } from '../../lib/api'

type Company = { id: number; name: string }
type Contact = { id: number; name: string; company: Company }
type Scope = { name: string; cost: number; status: 'Pending'|'Won'|'Lost' }

// Small helper: currency
const currency = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

// Reusable Combo: text filter + select (keeps dropdown, adds search)
function ComboSelect<T extends { id: number; name: string }>(props: {
  label: string
  value: number | ''                // selected id (or '')
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

export default function EditBid(){
  const navigate = useNavigate()
  const { id } = useParams()
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [form, setForm] = React.useState<any>(null)

  React.useEffect(()=>{
    getJSON<Company[]>('/companies').then(cs => setCompanies(cs.map(c => ({ id: c.id, name: c.name }))))
    getJSON<Contact[]>('/contacts').then(setContacts)
    getJSON<any>(`/bids/${id}`).then(b => {
      setForm({
        projectName: b.projectName,
        clientCompanyId: b.clientCompanyId,
        contactId: b.contactId || '',
        proposalDate: b.proposalDate?.slice(0,10) || '',
        dueDate: b.dueDate?.slice(0,10) || '',
        jobLocation: b.jobLocation || '',
        leadSource: b.leadSource || '',
        bidStatus: b.bidStatus,
        scopes: b.scopes.map((s:any)=>({ name: s.name, cost: s.cost, status: s.status }))
      })
    })
  },[id])

  if(!form) return <div>Loading…</div>

  function setField(k:string, v:any){ setForm((f:any)=>({...f,[k]:v})) }
  function setScope(i:number, k:keyof Scope, v:any){
    setForm((f:any)=>({
      ...f,
      scopes: f.scopes.map((s:Scope,idx:number)=> idx===i ? { ...s, [k]: k==='cost' ? Number(v) : v } : s)
    }))
  }
  function addScope(){
    setForm((f:any)=>({...f, scopes:[...f.scopes,{name:'', cost:0, status:'Pending'}]}))
  }
  function removeScope(i:number){
    setForm((f:any)=>({...f, scopes: f.scopes.filter((_:any,idx:number)=>idx!==i)}))
  }

  async function submit(){
    const payload = {
      ...form,
      clientCompanyId: Number(form.clientCompanyId) || undefined,
      contactId: form.contactId ? Number(form.contactId) : undefined
    }
    await putJSON(`/bids/${id}`, payload)
    navigate('/bids')
  }

  const total = form.scopes.reduce((a:number,s:Scope)=>a+Number(s.cost||0),0)

  return (
    <div className="max-w-3xl font-sans">
      <div className="mb-4 text-2xl font-extrabold tracking-tight">Edit Bid</div>

      <div className="card space-y-5 p-5">
        <div>
          <label className="label">Project Name</label>
          <input
            className="input"
            value={form.projectName}
            onChange={e=>setField('projectName', e.target.value)}
          />
        </div>

        {/* Company + Contact (searchable combo + select) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="Client Company"
            value={form.clientCompanyId}
            options={companies}
            onChange={(v)=>setField('clientCompanyId', v)}
            placeholder="Search company…"
          />
          <ComboSelect
            label="Contact Person"
            value={form.contactId}
            options={contacts.map(c => ({ id: c.id, name: `${c.name} (${c.company?.name ?? '—'})` }))}
            onChange={(v)=>setField('contactId', v)}
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
              onChange={e=>setField('proposalDate', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input
              className="input"
              type="date"
              value={form.dueDate}
              onChange={e=>setField('dueDate', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">Job Location</label>
            <input
              className="input"
              value={form.jobLocation}
              onChange={e=>setField('jobLocation', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Lead Source</label>
            <input
              className="input"
              value={form.leadSource}
              onChange={e=>setField('leadSource', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Bid Status</label>
          <select
            className="select"
            value={form.bidStatus}
            onChange={e=>setField('bidStatus', e.target.value)}
          >
            <option>Active</option>
            <option>Complete</option>
            <option>Archived</option>
          </select>
        </div>

        {/* Scopes */}
        <div className="pt-2">
          <div className="mb-2 font-medium">Scope Breakdown</div>
          {form.scopes.map((s:Scope,i:number)=>(
            <div key={i} className="mb-2 grid grid-cols-12 items-center gap-2">
              <input
                className="input col-span-5 md:col-span-5"
                placeholder="Scope Name"
                value={s.name}
                onChange={e=>setScope(i,'name',e.target.value)}
              />
              <input
                className="input col-span-3 md:col-span-3"
                type="number"
                min={0}
                step={1}
                placeholder="Cost"
                value={s.cost}
                onChange={e=>setScope(i,'cost',e.target.value)}
              />
              <select
                className="select col-span-3 md:col-span-3"
                value={s.status}
                onChange={e=>setScope(i,'status',e.target.value)}
              >
                <option>Pending</option>
                <option>Won</option>
                <option>Lost</option>
              </select>
              <button
                type="button"
                className="col-span-1 rounded-lg border border-rose-300 px-2 py-1 text-rose-600 hover:bg-rose-50"
                onClick={()=>removeScope(i)}
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
            + Add Scope
          </button>
        </div>

        <div className="pt-2 text-right text-lg font-semibold">
          Total: {currency(total)}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="rounded-lg bg-rose-600 px-4 py-2 text-white shadow hover:bg-rose-700"
            onClick={()=>history.back()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-700"
            onClick={submit}
          >
            Update Bid
          </button>
        </div>
      </div>
    </div>
  )
}
