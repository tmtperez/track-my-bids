// src/pages/companies/AddCompany.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { postJSON } from '../../lib/api'

export default function AddCompany() {
  const navigate = useNavigate()
  const [name, setName] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSave() {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Company name is required')
      return
    }
    try {
      setSaving(true)
      // IMPORTANT:
      // If your getJSON/postJSON prepend `/api`, keep '/companies' here.
      // If they DON'T prepend, use '/api/companies' instead.
      await postJSON('/companies', { name: trimmed })
      navigate('/companies')
    } catch (e: any) {
      setError(e?.message || 'Failed to save company')
    } finally {
      setSaving(false)
    }
  }

  function onCancel() {
    navigate('/companies')
  }

  return (
    <div className="max-w-xl space-y-4 font-sans">
      <h1 className="text-2xl font-extrabold tracking-tight">Add Company</h1>

      <div className="card p-5 space-y-4">
        <div>
          <label className="label">Company Name</label>
          <input
            className="input"
            placeholder="e.g. Acme Construction"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
