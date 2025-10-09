// client/src/pages/companies/List.tsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getJSON, delJSON } from '../../lib/api'

type Contact = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  isPrimary: boolean
}

type AccountManager = {
  id: number
  name: string | null
  email: string
}

type Row = {
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
  primaryContact?: Contact
  tags: string[]
  projects: { id: number; name: string }[]
  won: number
  lost: number
  totalBidValue: number
  avgProjectSize: number
  activeBids: number
  totalProjects: number
  contactsCount: number
  attachmentsCount: number
  activityLogsCount: number
}

const currency = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function Companies() {
  const [rows, setRows] = React.useState<Row[]>([])
  const [search, setSearch] = React.useState('')
  const [deletingId, setDeletingId] = React.useState<number | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [deletingSelected, setDeletingSelected] = React.useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    getJSON<Row[]>('/companies').then(setRows)
  }, [])

  async function deleteCompany(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This will also delete all contacts, tags, attachments, and activity logs. This cannot be undone.`)) {
      return
    }

    setDeletingId(id)
    try {
      await delJSON(`/companies/${id}`)
      setRows(prev => prev.filter(r => r.id !== id))
    } catch (e: any) {
      alert(`Failed to delete "${name}": ${e?.message || e}`)
    } finally {
      setDeletingId(null)
    }
  }

  // handle selecting a project from the dropdown
  function handleProjectSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const bidId = e.target.value
    if (!bidId) return // ignore the placeholder
    navigate(`/bids/${bidId}`)
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRows.map(r => r.id)))
    }
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected compan${selectedIds.size === 1 ? 'y' : 'ies'}? This will also delete all contacts, tags, attachments, and activity logs. This cannot be undone.`)) return

    setDeletingSelected(true)
    const errors: string[] = []

    for (const id of selectedIds) {
      try {
        await delJSON(`/companies/${id}`)
        setRows(prev => prev.filter(r => r.id !== id))
      } catch (e: any) {
        const company = rows.find(r => r.id === id)
        errors.push(`${company?.name || id}: ${e?.message || e}`)
      }
    }

    setSelectedIds(new Set())
    setDeletingSelected(false)

    if (errors.length > 0) {
      alert(`Some deletions failed:\n${errors.join('\n')}`)
    }
  }

  const filteredRows = React.useMemo(() => {
    if (!search) return rows
    const term = search.toLowerCase()
    return rows.filter(r => r.name.toLowerCase().includes(term))
  }, [rows, search])

  const totalStats = React.useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => ({
        companies: acc.companies + 1,
        projects: acc.projects + r.projects.length,
        won: acc.won + r.won,
        lost: acc.lost + r.lost,
      }),
      { companies: 0, projects: 0, won: 0, lost: 0 }
    )
  }, [filteredRows])

  return (
    <div className="space-y-6 font-sans">
      {/* Enhanced Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Companies
            </h1>
            <p className="text-slate-700 mt-1">Manage your client companies and track their performance</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={deleteSelected}
                disabled={deletingSelected}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deletingSelected ? 'Deleting...' : `Delete ${selectedIds.size}`}
              </button>
            )}
            <Link
              to="/companies/new"
              className="cursor-pointer px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Company
            </Link>
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
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-5 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-lg mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-sm font-medium text-blue-700">Total Companies</div>
          <div className="text-3xl font-extrabold text-blue-900 mt-1">{totalStats.companies}</div>
        </div>

        <div className="relative rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center text-white font-bold text-lg mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-sm font-medium text-cyan-700">Total Projects</div>
          <div className="text-3xl font-extrabold text-cyan-900 mt-1">{totalStats.projects}</div>
        </div>

        <div className="relative rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-5 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-lg mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm font-medium text-green-700">Total Won</div>
          <div className="text-3xl font-extrabold text-green-900 mt-1">{currency(totalStats.won)}</div>
        </div>

        <div className="relative rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-5 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-lg mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm font-medium text-red-700">Total Lost</div>
          <div className="text-3xl font-extrabold text-red-900 mt-1">{currency(totalStats.lost)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Account Mgr</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Active Bids</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Total Won</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Win Rate</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredRows.map((r) => {
                const total = r.won + r.lost
                const winRate = total > 0 ? (r.won / total) * 100 : 0

                const statusColors: Record<string, string> = {
                  active: 'bg-green-100 text-green-800 border-green-200',
                  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
                  prospect: 'bg-blue-100 text-blue-800 border-blue-200',
                }

                const statusColor = statusColors[r.relationshipStatus?.toLowerCase() || ''] || 'bg-slate-100 text-slate-800 border-slate-200'

                return (
                  <tr key={r.id} className={`hover:bg-slate-50 transition-colors duration-150 ${selectedIds.has(r.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{r.name}</div>
                          {r.city && r.state && (
                            <div className="text-xs text-slate-500">{r.city}, {r.state}</div>
                          )}
                          {r.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {r.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-700">
                                  {tag}
                                </span>
                              ))}
                              {r.tags.length > 2 && (
                                <span className="text-xs text-slate-500">+{r.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {r.primaryContact ? (
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">{r.primaryContact.name}</div>
                          {r.primaryContact.email && (
                            <div className="text-xs text-slate-500">{r.primaryContact.email}</div>
                          )}
                        </div>
                      ) : r.contacts.length > 0 ? (
                        <div className="text-sm text-slate-600">{r.contacts[0].name}</div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {r.accountManager ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs">
                            {(r.accountManager.name || r.accountManager.email).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-700">{r.accountManager.name || r.accountManager.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {r.relationshipStatus ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
                          {r.relationshipStatus.charAt(0).toUpperCase() + r.relationshipStatus.slice(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {r.activeBids}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {currency(r.won)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[80px]">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${winRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 min-w-[40px]">
                          {total > 0 ? `${winRate.toFixed(0)}%` : '—'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          to={`/companies/${r.id}`}
                          className="px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium transition-colors duration-150"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => deleteCompany(r.id, r.name)}
                          disabled={deletingId === r.id}
                          className="px-3 py-1.5 rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-medium transition-colors duration-150 disabled:opacity-50"
                        >
                          {deletingId === r.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-slate-500 font-medium">No companies found</p>
                      <p className="text-sm text-slate-400">Try adjusting your search or add a new company</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
