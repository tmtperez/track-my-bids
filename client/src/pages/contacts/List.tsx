import React from 'react'
import { getJSON, postJSON, putJSON, delJSON } from '../../lib/api'

type Contact = {
  id: number
  name: string
  title?: string | null
  email?: string
  phone?: string
  company: { id: number; name: string }
}
type Company = { id: number; name: string }

export default function Contacts() {
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [editing, setEditing] = React.useState<Contact | null>(null)
  const [adding, setAdding] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)
  const [search, setSearch] = React.useState('')

  const load = React.useCallback(() => {
    getJSON<Contact[]>('/contacts').then(setContacts)
    getJSON<any[]>('/companies').then(cs =>
      setCompanies(cs.map((x: any) => ({ id: x.id, name: x.name })))
    )
  }, [])

  React.useEffect(load, [load])

  async function save() {
    if (!editing) return
    await putJSON(`/contacts/${editing.id}`, {
      name: editing.name,
      title: editing.title ?? null,
      email: editing.email,
      phone: editing.phone,
      companyId: editing.company.id,
    })
    setEditing(null)
    load()
  }

  async function add(newc: any) {
    await postJSON('/contacts', newc)
    setAdding(false)
    load()
  }

  async function deleteContact(id: number, name: string) {
    if (!confirm(`Delete contact "${name}"? This cannot be undone.`)) {
      return
    }

    setDeletingId(id)
    try {
      await delJSON(`/contacts/${id}`)
      load()
    } catch (e: any) {
      alert(`Failed to delete "${name}": ${e?.message || e}`)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredContacts = React.useMemo(() => {
    if (!search) return contacts
    const term = search.toLowerCase()
    return contacts.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.company.name.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.title?.toLowerCase().includes(term)
    )
  }, [contacts, search])

  return (
    <div className="space-y-6 font-sans">
      {/* Modern Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl blur-xl opacity-20"></div>
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Contacts</h1>
                <p className="text-purple-50 text-sm mt-1">Manage your professional network</p>
              </div>
            </div>
            <button
              onClick={() => setAdding(true)}
              className="group px-5 py-2.5 rounded-lg bg-white text-purple-600 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Contact
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search contacts by name, company, email, or title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 pl-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
        />
        <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-md">
          <div className="text-purple-100 text-xs font-medium mb-1">Total Contacts</div>
          <div className="text-3xl font-bold">{contacts.length}</div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white shadow-md">
          <div className="text-pink-100 text-xs font-medium mb-1">Companies</div>
          <div className="text-3xl font-bold">{new Set(contacts.map(c => c.company.id)).size}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white shadow-md">
          <div className="text-red-100 text-xs font-medium mb-1">With Email</div>
          <div className="text-3xl font-bold">{contacts.filter(c => c.email).length}</div>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map(c => (
          <div key={c.id} className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(c)}
                  className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center transition-colors"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteContact(c.id, c.name)}
                  disabled={deletingId === c.id}
                  className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === c.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-lg">{c.name}</h3>
              {c.title && <p className="text-sm text-slate-600 mb-2">{c.title}</p>}
            </div>

            <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-slate-700 font-medium">{c.company.name}</span>
              </div>

              {c.email && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${c.email}`} className="text-purple-600 hover:text-purple-800 hover:underline truncate">
                    {c.email}
                  </a>
                </div>
              )}

              {c.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-slate-700">{c.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredContacts.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-slate-500 text-lg">No contacts found</p>
            <p className="text-slate-400 text-sm">Try adjusting your search</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Edit Contact</h2>
              <button
                onClick={() => setEditing(null)}
                className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Name *</label>
                <input
                  className="input focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input
                  className="input focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="CEO, PM, Estimator…"
                  value={editing.title ?? ''}
                  onChange={e => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Company *</label>
                <select
                  className="select focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={editing.company.id}
                  onChange={e =>
                    setEditing({
                      ...editing,
                      company: {
                        id: Number(e.target.value),
                        name: companies.find(x => x.id === Number(e.target.value))?.name || '',
                      },
                    })
                  }
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  className="input focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={editing.email || ''}
                  onChange={e => setEditing({ ...editing, email: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  className="input focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={editing.phone || ''}
                  onChange={e => setEditing({ ...editing, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {adding && (
        <AddContactModal
          companies={companies}
          onCancel={() => setAdding(false)}
          onSave={add}
        />
      )}
    </div>
  )
}

function AddContactModal({
  companies,
  onCancel,
  onSave,
}: {
  companies: Company[]
  onCancel: () => void
  onSave: (c: any) => void
}) {
  const [form, setForm] = React.useState<any>({
    name: '',
    title: '',
    companyId: '',
    email: '',
    phone: '',
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Add New Contact</h2>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Name *</label>
            <input
              className="input focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={form.name}
              onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
            <input
              className="input focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="CEO, PM, Estimator…"
              value={form.title}
              onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Company *</label>
            <select
              className="select focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={form.companyId}
              onChange={e => setForm((f: any) => ({ ...f, companyId: e.target.value }))}
            >
              <option value="">Select company…</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              className="input focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={form.email}
              onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
            <input
              type="tel"
              className="input focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={form.phone}
              onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                ...form,
                companyId: Number(form.companyId) || undefined,
                title: form.title || null,
              })
            }
            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Add Contact
          </button>
        </div>
      </div>
    </div>
  )
}
