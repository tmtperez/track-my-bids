import React from 'react'
import { getJSON, postJSON, putJSON, delJSON } from '../../lib/api'

type ScopeCatalogRow = {
  id: number
  name: string
}

export default function Scopes() {
  const [scopes, setScopes] = React.useState<ScopeCatalogRow[]>([])
  const [newScope, setNewScope] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<number | null>(null)

  React.useEffect(() => {
    setLoading(true)
    getJSON<ScopeCatalogRow[]>('/scopes')
      .then(setScopes)
      .catch(e => {
        setError(e?.message ?? 'Failed to load scopes')
      })
      .finally(() => setLoading(false))
  }, [])

  async function addScope(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const name = newScope.trim()
    if (!name) return
    try {
      const created = await postJSON<ScopeCatalogRow>('/scopes', { name })
      setScopes(prev => [...prev, created])
      setNewScope('')
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add scope')
    }
  }

  async function updateScope(id: number, name: string) {
    setError(null)
    const clean = name.trim()
    if (!clean) return
    try {
      const updated = await putJSON<ScopeCatalogRow>(`/scopes/${id}`, { name: clean })
      setScopes(prev => prev.map(sc => (sc.id === id ? updated : sc)))
      setEditingId(null)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update scope')
    }
  }

  async function deleteScope(id: number) {
    setError(null)
    try {
      await delJSON(`/scopes/${id}`)
      setScopes(prev => prev.filter(sc => sc.id !== id))
      setDeleteConfirm(null)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete scope')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-8 font-sans">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-4xl">📋</div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Scope Catalog
          </h1>
        </div>
        <p className="text-slate-600 ml-16">Manage project scopes and categories</p>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Add Scope Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">✨</span>
              Add New Scope
            </h2>
          </div>
          <div className="p-6">
            <form onSubmit={addScope} className="flex gap-3">
              <input
                className="flex-1 px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none text-lg"
                placeholder="Enter scope name..."
                value={newScope}
                onChange={e => setNewScope(e.target.value)}
              />
              <button
                type="submit"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
              >
                <span className="text-xl">+</span>
                <span>Add Scope</span>
              </button>
            </form>

            {error && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="text-xl">⚠️</span>
                  <span className="font-semibold">{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scopes List Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">All Scopes</h2>
                <p className="text-emerald-100 text-sm">{scopes.length} total scopes</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 font-medium">Loading scopes...</p>
              </div>
            ) : scopes.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <div className="text-6xl mb-4">📝</div>
                <div className="text-lg font-medium">No scopes yet</div>
                <div className="text-sm">Add your first scope to get started</div>
              </div>
            ) : (
              <div className="space-y-3">
                {scopes.map((sc, idx) => (
                  <div
                    key={sc.id}
                    className="group bg-gradient-to-r from-white to-slate-50 rounded-2xl p-5 border-2 border-slate-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-200"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {idx + 1}
                      </div>

                      {editingId === sc.id ? (
                        <input
                          className="flex-1 px-4 py-2 rounded-xl border-2 border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none font-medium"
                          defaultValue={sc.name}
                          autoFocus
                          onBlur={e => updateScope(sc.id, e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              updateScope(sc.id, e.currentTarget.value)
                            } else if (e.key === 'Escape') {
                              setEditingId(null)
                            }
                          }}
                        />
                      ) : (
                        <div className="flex-1">
                          <div className="text-lg font-semibold text-slate-800">{sc.name}</div>
                        </div>
                      )}

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingId === sc.id ? (
                          <button
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-medium text-sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        ) : (
                          <>
                            <button
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:shadow-lg transition-all hover:scale-105 font-medium text-sm flex items-center gap-1"
                              onClick={() => setEditingId(sc.id)}
                            >
                              <span>✏️</span> Edit
                            </button>
                            <button
                              className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 hover:shadow-lg transition-all hover:scale-105 font-medium text-sm flex items-center gap-1"
                              onClick={() => setDeleteConfirm(sc.id)}
                            >
                              <span>🗑️</span> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-emerald-900/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative z-50 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-emerald-200 animate-scale-in">
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">⚠️</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  Delete Scope
                </div>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <p className="text-slate-700">
                  Are you sure you want to delete this scope: <strong className="text-red-700">{scopes.find(s => s.id === deleteConfirm)?.name}</strong>?
                </p>
                <p className="text-sm text-slate-600 mt-2">This action cannot be undone.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold hover:shadow-xl transition-all hover:scale-105"
                  onClick={() => deleteScope(deleteConfirm)}
                >
                  🗑️ Delete Scope
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
