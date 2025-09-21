import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getJSON, putJSON } from '../../lib/api' // ⬅️ added putJSON

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

/* ----------------------- ADDED: scope catalog + combobox ------------------- */
const SCOPE_LS_KEY = 'scopeCatalog.v1'
const DEFAULT_SCOPES = [
  'Architectural Aluminum',
  'Canopies',
  'Awnings',
  'Pergola',
  'Trellis',
  'Arbor',
  'Shutters',
  'Cabana',
  'String Light Poles',
  'Pool LSE',
  'Balcony Rail',
  'Screen',
  'Perimeter Fence',
  'Retaining Wall Rail',
  'ADA Rail',
  'Pool Fence',
  'Dog Park Fence',
  'Wood Fence',
  'Welded Wire Fence',
  'Cable Rail',
  'Pedestrian Gates',
  'Breezeway Gates',
  'Entry Gates',
  'Compactor Gates',
  'Compactor Rail',
  'Pool Gates',
  'Dog Park Gates',
  'Glass Fence',
  'Glass Gates',
  'Chain Link Fence',
  'PVC Fence',
] as const

function loadScopeCatalog(): string[] {
  try {
    const raw = localStorage.getItem(SCOPE_LS_KEY)
    const saved: string[] = raw ? JSON.parse(raw) : []
    const merged = Array.from(new Set([...DEFAULT_SCOPES, ...saved]))
    return merged.sort((a, b) => a.localeCompare(b))
  } catch {
    return [...DEFAULT_SCOPES].sort((a, b) => a.localeCompare(b))
  }
}

function saveScopeCatalog(catalog: string[]) {
  const extras = catalog.filter(s => !DEFAULT_SCOPES.includes(s as any))
  localStorage.setItem(SCOPE_LS_KEY, JSON.stringify(extras))
}

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
                onChange(val)
                if (!exists && onCommitNew) onCommitNew(val)
                setOpen(false)
              }
            } else {
              const val = query.trim()
              if (!val) return
              onChange(val)
              if (!exists && onCommitNew) onCommitNew(val)
            }
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        onBlur={() => {
          const val = query.trim()
          if (!val) return
          onChange(val)
          if (!exists && onCommitNew) onCommitNew(val)
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
                onChange(val)
                onCommitNew?.(val)
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
/* --------------------- END: scope catalog + combobox additions -------------- */

export default function BidDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bid, setBid] = React.useState<Bid | null>(null)

  // ADDED: editor state for scopes + catalog
  const [scopeCatalog, setScopeCatalog] = React.useState<string[]>(() => loadScopeCatalog())
  const [editScopes, setEditScopes] = React.useState<Scope[]>([])
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)

  React.useEffect(() => {
    getJSON<Bid>(`/bids/${id}`).then(b => {
      setBid(b)
      setEditScopes(b.scopes?.map(s => ({ ...s })) ?? [])
    })
  }, [id])

  function addToCatalogIfMissing(name: string) {
    const val = (name || '').trim()
    if (!val) return
    if (scopeCatalog.some(s => s.toLowerCase() === val.toLowerCase())) return
    setScopeCatalog(prev => {
      const next = [...prev, val].sort((a, b) => a.localeCompare(b))
      saveScopeCatalog(next)
      return next
    })
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

  async function saveScopes() {
    if (!bid) return
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        projectName: bid.projectName,
        clientCompanyId: bid.clientCompany?.id,
        contactId: bid.contact?.id ?? null,
        proposalDate: bid.proposalDate ?? null,
        dueDate: bid.dueDate ?? null,
        followUpOn: bid.followUpOn ?? null,
        jobLocation: bid.jobLocation ?? null,
        leadSource: bid.leadSource ?? null,
        bidStatus: bid.bidStatus,
        scopes: editScopes.map(s => ({
          name: (s.name || '').trim(),
          cost: Number(s.cost || 0),
          status: s.status,
        })),
      }
      await putJSON(`/bids/${bid.id}`, payload)
      // refresh the read-only view
      const refreshed = await getJSON<Bid>(`/bids/${bid.id}`)
      setBid(refreshed)
      setEditScopes(refreshed.scopes?.map(s => ({ ...s })) ?? [])
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save scopes')
    } finally {
      setSaving(false)
    }
  }

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
              FOLLOW-UP IN
            </div>
            <div className="text-slate-900">{dateFmt(bid.followUpOn)}</div>
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

      {/* Scopes (read-only, original) */}
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
                <td className="px-4 py-3">
                  {currency(bid.scopes.reduce((a, s) => a + Number(s.cost || 0), 0))}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------ ADDED: Editable Scopes (with dropdown) ------------------ */}
      <div className="rounded-xl bg-white p-6 shadow-soft ring-1 ring-black/5">
        <div className="mb-3 text-lg font-semibold">Edit Scopes</div>

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
            >
              −
            </button>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            onClick={addScopeRow}
          >
            + Add scope
          </button>
          <div className="ml-auto flex items-center gap-2">
            {saveError && <span className="text-sm text-rose-600">{saveError}</span>}
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-700 disabled:opacity-60"
              onClick={saveScopes}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Scopes'}
            </button>
          </div>
        </div>
      </div>
      {/* ---------------- END: Editable Scopes (with dropdown) --------------------- */}
    </div>
  )
}
