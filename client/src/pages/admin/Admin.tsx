// client/src/pages/admin/Admin.tsx
import React from 'react'
import { getJSON, postJSON, putJSON, delJSON } from '../../lib/api'

type AppRole = 'ADMIN' | 'MANAGER' | 'USER'
type User = {
  id: number
  name: string | null
  email: string
  role: AppRole
}

type DialogState =
  | { kind: 'idle' }
  | { kind: 'add' }
  | { kind: 'edit'; user: User }
  | { kind: 'delete'; user: User }

const ROLES: AppRole[] = ['ADMIN', 'MANAGER', 'USER']

const getRoleBadgeStyle = (role: AppRole) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
    case 'MANAGER':
      return 'bg-gradient-to-r from-cyan-500 to-green-500 text-white'
    case 'USER':
      return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
  }
}

const getRoleIcon = (role: AppRole) => {
  switch (role) {
    case 'ADMIN':
      return '👑'
    case 'MANAGER':
      return '⚡'
    case 'USER':
      return '✨'
  }
}

export default function Admin() {
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [dialog, setDialog] = React.useState<DialogState>({ kind: 'idle' })

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const list = await getJSON<User[]>('/users')
      setUsers(list)
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-8 font-sans">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-4xl">🛡️</div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-cyan-600 to-green-600 bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>
        <p className="text-slate-700 ml-16">Manage users and permissions</p>
      </div>

      {/* Main Card */}
      <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-green-600 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">User Management</h2>
              <p className="text-blue-100 text-sm">{users.length} total users</p>
            </div>
            <button
              className="group bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
              onClick={() => setDialog({ kind: 'add' })}
            >
              <span className="text-xl group-hover:rotate-90 transition-transform duration-300">+</span>
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 font-medium">Loading users...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <span className="text-xl">⚠️</span>
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <th className="text-left px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider">Name</th>
                    <th className="text-left px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr
                      key={u.id}
                      className="border-t border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{u.name || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-600">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${getRoleBadgeStyle(u.role)}`}>
                          <span>{getRoleIcon(u.role)}</span>
                          <span>{u.role}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:shadow-lg transition-all duration-200 hover:scale-105 font-medium text-sm"
                            onClick={() => setDialog({ kind: 'edit', user: u })}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 hover:shadow-lg transition-all duration-200 hover:scale-105 font-medium text-sm"
                            onClick={() => setDialog({ kind: 'delete', user: u })}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td className="px-6 py-20 text-center text-slate-400" colSpan={4}>
                        <div className="text-6xl mb-4">👥</div>
                        <div className="text-lg font-medium">No users yet</div>
                        <div className="text-sm">Add your first user to get started</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {dialog.kind !== 'idle' && (
        <Modal onClose={() => setDialog({ kind: 'idle' })}>
          {dialog.kind === 'delete' ? (
            <DeleteConfirm
              user={dialog.user}
              onCancel={() => setDialog({ kind: 'idle' })}
              onConfirm={async () => {
                await delJSON(`/users/${dialog.user.id}`)
                await load()
                setDialog({ kind: 'idle' })
              }}
            />
          ) : (
            <UserForm
              mode={dialog.kind}
              initial={dialog.kind === 'edit' ? dialog.user : null}
              onCancel={() => setDialog({ kind: 'idle' })}
              onSubmit={async (values) => {
                if (dialog.kind === 'add') {
                  await postJSON('/users', values)
                } else {
                  const { password, ...rest } = values
                  await putJSON(`/users/${dialog.user.id}`, password ? values : rest)
                }
                await load()
                setDialog({ kind: 'idle' })
              }}
            />
          )}
        </Modal>
      )}
    </div>
  )
}

/* ---------- Reusable Modal Shell ---------- */
function Modal(props: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-sm" onClick={props.onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl border border-blue-200 animate-scale-in">
        {props.children}
      </div>
    </div>
  )
}

/* ---------- Add/Edit Form ---------- */
function UserForm(props: {
  mode: 'add' | 'edit'
  initial: User | null
  onSubmit: (payload: {
    name: string
    email: string
    role: AppRole
    password?: string
  }) => Promise<void>
  onCancel: () => void
}) {
  const isEdit = props.mode === 'edit'
  const [name, setName] = React.useState(props.initial?.name ?? '')
  const [email, setEmail] = React.useState(props.initial?.email ?? '')
  const [role, setRole] = React.useState<AppRole>(props.initial?.role ?? 'USER')
  const [password, setPassword] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!name.trim() || !email.trim()) {
      setErr('Name and email are required.')
      return
    }
    if (!isEdit && !password) {
      setErr('Password is required for a new user.')
      return
    }
    setSaving(true)
    try {
      const payload: any = { name: name.trim(), email: email.trim().toLowerCase(), role }
      if (password) payload.password = password
      await props.onSubmit(payload)
    } catch (e: any) {
      setErr(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">{isEdit ? '✏️' : '➕'}</div>
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          {isEdit ? 'Edit User' : 'Add New User'}
        </div>
      </div>

      <label className="block">
        <div className="text-sm font-semibold text-slate-700 mb-2">Name</div>
        <input
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
          placeholder="Enter full name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </label>

      <label className="block">
        <div className="text-sm font-semibold text-slate-700 mb-2">Email</div>
        <input
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </label>

      <label className="block">
        <div className="text-sm font-semibold text-slate-700 mb-2">Role</div>
        <select
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none bg-white"
          value={role}
          onChange={e => setRole(e.target.value as AppRole)}
        >
          {ROLES.map(r => <option key={r} value={r}>{getRoleIcon(r as AppRole)} {r}</option>)}
        </select>
      </label>

      <label className="block">
        <div className="text-sm font-semibold text-slate-700 mb-2">
          {isEdit ? 'New Password (optional)' : 'Password'}
        </div>
        <input
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </label>

      {err && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
          <div className="text-sm text-red-700 font-medium">{err}</div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all"
          onClick={props.onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          disabled={saving}
        >
          {saving ? '⏳ Saving...' : isEdit ? '💾 Save Changes' : '✨ Create User'}
        </button>
      </div>
    </form>
  )
}

/* ---------- Delete Confirm ---------- */
function DeleteConfirm(props: { user: User; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">⚠️</div>
        <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
          Delete User
        </div>
      </div>

      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
        <p className="text-slate-700">
          Are you sure you want to delete <strong className="text-red-700">{props.user.email}</strong>?
        </p>
        <p className="text-sm text-slate-600 mt-2">This action cannot be undone.</p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all"
          onClick={props.onCancel}
        >
          Cancel
        </button>
        <button
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold hover:shadow-xl transition-all hover:scale-105"
          onClick={props.onConfirm}
        >
          🗑️ Delete User
        </button>
      </div>
    </div>
  )
}
