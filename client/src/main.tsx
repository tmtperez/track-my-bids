import React from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useNavigate,
} from 'react-router-dom'

import './styles.css'
import Dashboard from './pages/dashboard/Dashboard'
import Bids from './pages/bids/List'
import AddBid from './pages/bids/Add'
import EditBid from './pages/bids/Edit'
import BidDetails from './pages/bids/Detail'
import Companies from './pages/companies/List'
import Contacts from './pages/contacts/List'
import AddCompany from './pages/companies/AddCompany'

import { ProtectedRoute } from './ProtectedRoute'
import { AuthProvider, AuthContext } from './state/AuthContext'
import { onUnauthorized, setAuthToken } from './lib/api'

// Redirect to /login on 401s anywhere
onUnauthorized(() => {
  setAuthToken(null)
  localStorage.removeItem('user')
  window.location.href = '/login'
})

function Navbar() {
  const auth = React.useContext(AuthContext)
  return (
    <header className="topbar border-b border-slate-200">
      <div className="container-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-700 text-white flex items-center justify-center shadow-soft">BF</div>
          <div className="text-lg font-semibold text-ink-900">Barfield Fence & Fabrication, Inc.</div>
        </div>
        <nav className="flex gap-1 font-semibold">
          <NavLink to="/dashboard" className={({isActive}) => `navlink flex items-center px-3 py-1.5 rounded-md ${isActive ? 'navlink-active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/bids" className={({isActive}) => `navlink flex items-center px-3 py-1.5 rounded-md ${isActive ? 'navlink-active' : ''}`}>Bids</NavLink>
          <NavLink to="/companies" className={({isActive}) => `navlink flex items-center px-3 py-1.5 rounded-md ${isActive ? 'navlink-active' : ''}`}>Companies</NavLink>
          <NavLink to="/contacts" className={({isActive}) => `navlink flex items-center px-3 py-1.5 rounded-md ${isActive ? 'navlink-active' : ''}`}>Contacts</NavLink>
          <NavLink to="/bids/new" className="ml-2">
            <span className="btn btn-primary">Add New Bid</span>
          </NavLink>

          {auth.user ? (
            <button className="ml-3 btn-secondary px-3 py-1.5 rounded" onClick={auth.logout}>
              Logout
            </button>
          ) : (
            <NavLink to="/login" className="ml-3 btn-secondary px-3 py-1.5 rounded">
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}

// Minimal login screen
function LoginPage() {
  const auth = React.useContext(AuthContext)
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('admin@demo.local')
  const [password, setPassword] = React.useState('changeme')
  const [err, setErr] = React.useState<string>('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    try {
      await auth.login(email, password)
      navigate('/dashboard')
    } catch (e: any) {
      setErr(e?.message || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 card p-6">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input w-full" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input w-full" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {err && <div className="text-rose-600 text-sm">Login failed</div>}
        <button type="submit" className="btn btn-primary w-full">Sign in</button>
      </form>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main className="container-7xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />

              <Route path="/bids" element={<ProtectedRoute><Bids/></ProtectedRoute>} />
              <Route path="/bids/new" element={<ProtectedRoute roles={['ADMIN','MANAGER','ESTIMATOR']}><AddBid /></ProtectedRoute>}/>
              <Route path="/bids/:id" element={<ProtectedRoute><BidDetails/></ProtectedRoute>} />
              <Route path="/bids/:id/edit" element={<ProtectedRoute roles={['ADMIN','MANAGER','ESTIMATOR']}><EditBid/></ProtectedRoute>} />

              <Route path="/companies" element={<ProtectedRoute><Companies/></ProtectedRoute>} />
              <Route path="/companies/new" element={<ProtectedRoute roles={['ADMIN','MANAGER']}><AddCompany/></ProtectedRoute>} />

              <Route path="/contacts" element={<ProtectedRoute><Contacts/></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(<App/>)
