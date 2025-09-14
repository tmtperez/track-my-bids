import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../state/AuthContext'
import { setAuthToken } from '../../lib/api'

export default function LoginPage() {
  const { login } = React.useContext(AuthContext)
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('admin@demo.local')
  const [password, setPassword] = React.useState('changeme')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)           // calls /api/auth/login
      // AuthContext.login should set token + user; mirror token to api helper too:
      setAuthToken(localStorage.getItem('auth_token'))
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="card p-5 space-y-4">
        {error && <div className="rounded-md bg-rose-50 text-rose-700 px-3 py-2 text-sm">{error}</div>}
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="you@company.com"
            autoFocus
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-70"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
