import React from 'react'
import { getJSON, postJSON, putJSON } from '../../lib/api'

type Contact = {
  id: number
  name: string
  title?: string | null
  email?: string
  phone?: string
  company: { id: number; name: string }
}
type Company = { id: number; name: string }

type Row = {
  id: number
  name: string
  projects: { id: number; name: string }[]
  won: number
  lost: number
}

function currency(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export default function Contacts() {
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [editing, setEditing] = React.useState<Contact | null>(null)
  const [adding, setAdding] = React.useState(false)
  const [rows, setRows] = React.useState<Row[]>([])

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

  // Button styles (green primary to match Companies page)
  const btn = {
    base:
      'inline-flex items-center justify-center rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2',
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-400',
    softPrimary:
      'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-300',
    secondary:
      'border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-300',
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
          Contacts
        </h1>
        <button
          className={`${btn.base} ${btn.primary} px-5 py-2.5 shadow`}
          onClick={() => setAdding(true)}
        >
          Add New Contact
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="table">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-base font-bold uppercase tracking-wider text-slate-600">CONTACT NAME</th>
              <th className="px-4 py-3 text-left text-base font-bold uppercase tracking-wider text-slate-600">TITLE</th>
              <th className="px-4 py-3 text-left text-base font-bold uppercase tracking-wider text-slate-600">COMPANY</th>
              <th className="px-4 py-3 text-left text-base font-bold uppercase tracking-wider text-slate-600">EMAIL</th>
              <th className="px-4 py-3 text-left text-base font-bold uppercase tracking-wider text-slate-600">PHONE</th>
              <th className="px-4 py-3 !text-center text-base font-bold uppercase tracking-wider text-slate-600">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="text-[15px]">
            {contacts.map(c => (
              <tr key={c.id} className="border-t hover:bg-slate-50/60">
                <td className="font-medium text-slate-800">{c.name}</td>
                <td className="text-slate-700">{c.title || '—'}</td>
                <td>{c.company.name}</td>
                <td className="text-slate-600">{c.email || '—'}</td>
                <td className="text-slate-600">{c.phone || '—'}</td>
                <td className="text-center">
                  <button
                    className={`${btn.base} ${btn.softPrimary} px-5 py-1.5`}
                    onClick={() => setEditing(c)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  No contacts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit card */}
      {editing && (
        <div className="rounded-xl bg-white p-5 shadow-xl ring-1 ring-slate-900/10">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-lg font-semibold">Edit Contact</div>
            <button
              className={`${btn.base} ${btn.secondary} px-3 py-1.5`}
              onClick={() => setEditing(null)}
              title="Close"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={editing.name}
                onChange={e => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                placeholder="CEO, PM, Estimator…"
                value={editing.title ?? ''}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Company</label>
              <select
                className="select"
                value={editing.company.id}
                onChange={e =>
                  setEditing({
                    ...editing,
                    company: {
                      id: Number(e.target.value),
                      name:
                        companies.find(x => x.id === Number(e.target.value))
                          ?.name || '',
                    },
                  })
                }
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                value={editing.email || ''}
                onChange={e =>
                  setEditing({ ...editing, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={editing.phone || ''}
                onChange={e =>
                  setEditing({ ...editing, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              className={`${btn.base} ${btn.danger} px-4 py-2`}
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
            <button
              className={`${btn.base} ${btn.primary} px-4 py-2 shadow`}
              onClick={save}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Add card (inline) */}
      {adding && (
        <AddContactCard
          companies={companies}
          onCancel={() => setAdding(false)}
          onSave={add}
        />
      )}
    </div>
  )
}

function AddContactCard({
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

  const btn =
    'inline-flex items-center justify-center rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2'

  return (
    <div className="rounded-xl bg-white p-5 shadow-xl ring-1 ring-slate-900/10">
      <div className="mb-3 text-lg font-semibold">Add New Contact</div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={form.name}
            onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            placeholder="CEO, PM, Estimator…"
            value={form.title}
            onChange={e =>
              setForm((f: any) => ({ ...f, title: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="label">Company</label>
          <select
            className="select"
            value={form.companyId}
            onChange={e =>
              setForm((f: any) => ({ ...f, companyId: e.target.value }))
            }
          >
            <option value="">Select…</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            value={form.email}
            onChange={e =>
              setForm((f: any) => ({ ...f, email: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="input"
            value={form.phone}
            onChange={e =>
              setForm((f: any) => ({ ...f, phone: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className={`${btn} bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-300 px-4 py-2`}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-300 px-4 py-2 shadow`}
          onClick={() =>
            onSave({
              ...form,
              companyId: Number(form.companyId) || undefined,
              title: form.title || null,
            })
          }
        >
          Add Contact
        </button>
      </div>
    </div>
  )
}
