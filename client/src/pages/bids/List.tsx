import React from 'react'
import { Link } from 'react-router-dom'
import { getJSON, uploadFile, delJSON } from '../../lib/api'
import { AuthContext } from '../../state/AuthContext'

type Row = {
  id: number
  projectName: string
  clientName: string
  amount: number
  proposalDate?: string | null
  dueDate?: string | null
  followUpOn?: string | null
  scopeStatus: 'Pending' | 'Won' | 'Lost' | 'Unknown'
  bidStatus: 'Active' | 'Complete' | 'Archived' | 'Hot' | 'Cold'
  estimator?: { id: number; name: string | null; email: string } | null
  lastModifiedBy?: { id: number; name: string | null; email: string } | null
  lastModifiedAt?: string | null
}

function currency(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function parseDate(v?: string | null): Date | null {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}
const fmt = (v?: string | null) => {
  const d = parseDate(v)
  return d ? d.toISOString().slice(0, 10) : '—'
}
const daysBetween = (a?: string | null, b?: string | null) => {
  const A = parseDate(a)?.getTime()
  const B = parseDate(b)?.getTime()
  if (A == null || B == null) return null
  return Math.max(0, Math.ceil((B - A) / 86_400_000))
}

type SortBy = 'proposalDate' | 'dueDate' | 'dueIn'
type SortDir = 'asc' | 'desc'
type PendingDelete = { id: number; projectName: string } | null

export default function Bids() {
  const auth = React.useContext(AuthContext)

  const [tab, setTab] = React.useState<'Active' | 'Complete' | 'Archived' | 'Hot' | 'Cold'>('Active')
  const [rows, setRows] = React.useState<Row[]>([])
  const [search, setSearch] = React.useState('')
  const [from, setFrom] = React.useState<string>('')
  const [to, setTo] = React.useState<string>('')

  const [dueInMax, setDueInMax] = React.useState<string>('')
  const [sortBy, setSortBy] = React.useState<SortBy>('dueDate')
  const [sortDir, setSortDir] = React.useState<SortDir>('asc')

  const [deletingId, setDeletingId] = React.useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<PendingDelete>(null)

  const load = React.useCallback(() => {
    const q = new URLSearchParams()
    q.set('status', tab)
    if (search) q.set('search', search)
    if (from) q.set('createdFrom', from)
    if (to) q.set('createdTo', to)
    getJSON<Row[]>(`/bids?${q.toString()}`).then(setRows)
  }, [tab, search, from, to])

  React.useEffect(() => { load() }, [load])

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    await uploadFile('/import/bids', f)
    alert('Import complete')
    load()
  }

  function askDelete(id: number, projectName: string) {
    setPendingDelete({ id, projectName })
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const { id, projectName } = pendingDelete
    setDeletingId(id)
    try {
      await delJSON(`/bids/${id}`)
      setRows(prev => prev.filter(x => x.id !== id))
      setPendingDelete(null)
    } catch (e: any) {
      alert(`Failed to delete "${projectName}": ${e?.message || e}`)
    } finally {
      setDeletingId(null)
    }
  }

  function cancelDelete() {
    setPendingDelete(null)
  }

  const viewRows = React.useMemo(() => {
    let r = rows.map(row => {
      const dueIn = daysBetween(row.proposalDate ?? null, row.dueDate ?? null)
      return { ...row, _dueIn: dueIn } as Row & { _dueIn: number | null }
    })

    const max = Number(dueInMax)
    if (dueInMax !== '' && Number.isFinite(max)) {
      r = r.filter(row => row._dueIn !== null && row._dueIn <= max)
    }

    r.sort((a, b) => {
      const pick = (row: any) => {
        if (sortBy === 'dueIn') return row._dueIn
        if (sortBy === 'proposalDate') return parseDate(row.proposalDate)?.getTime() ?? null
        return parseDate(row.dueDate)?.getTime() ?? null
      }
      const va = pick(a)
      const vb = pick(b)
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      const diff = (va as number) - (vb as number)
      return sortDir === 'asc' ? diff : -diff
    })

    return r
  }, [rows, dueInMax, sortBy, sortDir])

  return (
    <div className="space-y-6 font-sans">
      {/* Enhanced Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              All Bids
            </h1>
            <p className="text-slate-600 mt-1">Manage and track all your project bids</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <input type="file" accept=".csv" onChange={onImport} className="hidden" />
              Import CSV
            </label>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="Search project, client, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters row */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-slate-700">Created:</span>
            <input type="date" className="input !w-28 sm:!w-40 !py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-sm text-slate-500">to</span>
            <input type="date" className="input !w-28 sm:!w-40 !py-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
            <button
              type="button"
              className="ml-2 px-3 py-1.5 rounded-md bg-red-500 text-white text-sm font-medium shadow-sm hover:bg-red-600 hover:shadow transition-all duration-200"
              onClick={() => { setFrom(''); setTo('') }}
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-slate-700">Due in ≤</span>
            <input
              type="number"
              min={0}
              className="input !w-24 !py-1.5"
              placeholder="days"
              value={dueInMax}
              onChange={(e) => setDueInMax(e.target.value)}
            />
            <span className="text-sm text-slate-500">days</span>
          </div>

          <div className="ml-auto flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-slate-700">Sort by:</span>
            <select className="input !w-36 !py-1.5" value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}>
              <option value="proposalDate">Proposal Date</option>
              <option value="dueDate">Due Date</option>
              <option value="dueIn">Due in (days)</option>
            </select>
            <select className="input !w-32 !py-1.5" value={sortDir} onChange={e => setSortDir(e.target.value as SortDir)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['Active', 'Complete', 'Archived', 'Hot', 'Cold'] as const).map((s) => {
          const active = tab === s
          return (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={
                'px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ' +
                (active
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-300 hover:shadow-md')
              }
            >
              {s}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Project Name</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Client</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Proposal Date</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Follow-Up</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Estimator</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Last Modified</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {viewRows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900">{r.projectName}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{r.clientName}</td>
                  <td className="px-4 py-4 text-sm font-medium text-green-700">{currency(r.amount)}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{fmt(r.proposalDate)}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {fmt(r.dueDate)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{fmt(r.followUpOn)}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {r.estimator ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                          {(r.estimator.name || r.estimator.email).charAt(0).toUpperCase()}
                        </div>
                        <span>{r.estimator.name || r.estimator.email}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {r.lastModifiedBy ? (
                      <div>
                        <div className="font-medium text-slate-900">{r.lastModifiedBy.name || r.lastModifiedBy.email}</div>
                        <div className="text-xs text-slate-500">{r.lastModifiedAt ? new Date(r.lastModifiedAt).toLocaleString() : '—'}</div>
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/bids/${r.id}`}
                        className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium transition-colors duration-150"
                        title="View Details"
                      >
                        View
                      </Link>

                      <Link
                        to={`/bids/${r.id}/edit`}
                        className="px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium transition-colors duration-150"
                        title="Edit"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => askDelete(r.id, r.projectName)}
                        disabled={deletingId === r.id}
                        className="px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 text-xs font-medium transition-colors duration-150"
                        title="Delete"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {viewRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-slate-500 font-medium">No bids found</p>
                      <p className="text-sm text-slate-400">Try adjusting your filters or search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-app confirm modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={cancelDelete} />
          <div className="relative z-10 w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="text-lg font-semibold mb-2">Delete bid?</div>
            <p className="text-sm text-slate-600 mb-4">
              Delete <span className="font-medium">"{pendingDelete.projectName}"</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={cancelDelete} className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId === pendingDelete.id}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {deletingId === pendingDelete.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
