import React from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useNavigate,
  useLocation,
} from 'react-router-dom'

import './styles.css'
import Dashboard from './pages/dashboard/Dashboard'
import Bids from './pages/bids/List'
import AddBid from './pages/bids/Add'
import EditBid from './pages/bids/Edit'
import BidDetails from './pages/bids/Detail'
import Companies from './pages/companies/List'
import CompanyDetail from './pages/companies/Detail'
import Contacts from './pages/contacts/List'
import AddCompany from './pages/companies/AddCompany'
import Scopes from './pages/scopes/List'   // ⬅️ Scopes page
import Admin from './pages/admin/Admin'

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
  const location = useLocation()
  const onLoginPage = location.pathname === '/login'

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-xl">
      <div className="max-w-[98%] mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center shadow-lg font-bold text-xl">
              BF
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <div className="hidden md:block">
            <div className="text-xl font-bold text-white tracking-tight">
              Barfield Fence & Fabrication
            </div>
            <div className="text-xs text-slate-400">Bid Management System</div>
          </div>
        </div>

        <nav className="flex items-center gap-1 justify-end flex-shrink min-w-0">
          {onLoginPage ? (
            <NavLink to="/login" className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200">
              Login
            </NavLink>
          ) : (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`
                }
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden lg:inline">Dashboard</span>
              </NavLink>

              <NavLink
                to="/bids"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`
                }
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden lg:inline">Bids</span>
              </NavLink>

              <NavLink
                to="/companies"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`
                }
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="hidden lg:inline">Companies</span>
              </NavLink>

              <NavLink
                to="/contacts"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`
                }
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden lg:inline">Contacts</span>
              </NavLink>

              <NavLink
                to="/scopes"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`
                }
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span className="hidden lg:inline">Scopes</span>
              </NavLink>

              {auth.user?.role === 'ADMIN' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`
                  }
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hidden lg:inline">Admin</span>
                </NavLink>
              )}

              <NavLink to="/bids/new" className="ml-2 group">
                <span className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold shadow-lg hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-110 transition-all duration-300 flex items-center gap-2 whitespace-nowrap overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <svg className="w-5 h-5 flex-shrink-0 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline relative z-10">New Bid</span>
                  <span className="sm:hidden relative z-10">New</span>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
                </span>
              </NavLink>

              {auth.user && (
                <div className="ml-2 flex items-center gap-2 flex-shrink-0">
                  <div className="text-right hidden xl:block flex-shrink-0">
                    <div className="text-sm font-semibold text-white">{auth.user.name || 'User'}</div>
                    <div className="text-xs text-slate-400">{auth.user.role}</div>
                  </div>
                  <button
                    className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                    onClick={auth.logout}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

// Minimal login screen (anti-autofill)
function LoginPage() {
  const auth = React.useContext(AuthContext)
  const navigate = useNavigate()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [err, setErr] = React.useState<string>('')

  const [emailRO, setEmailRO] = React.useState(true)
  const [passRO, setPassRO] = React.useState(true)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    try {
      await auth.login(email, password)
      setAuthToken(localStorage.getItem('auth_token'))
      navigate('/dashboard')
    } catch (e: any) {
      setErr(e?.message || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 card p-6">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
        <div aria-hidden="true" style={{position:'absolute',left:'-10000px',top:'auto',width:'1px',height:'1px',overflow:'hidden'}}>
          <input type="text" tabIndex={-1} name="username" autoComplete="username" readOnly value="" />
          <input type="password" tabIndex={-1} name="password" autoComplete="current-password" readOnly value="" />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            className="input w-full"
            type="email"
            name="login-email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="new-email"
            readOnly={emailRO}
            onFocus={() => setEmailRO(false)}
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input w-full"
            type="password"
            name="login-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            readOnly={passRO}
            onFocus={() => setPassRO(false)}
          />
        </div>
        {err && <div className="text-rose-600 text-sm">Login failed</div>}
        <button type="submit" className="btn btn-primary w-full">
          Sign in
        </button>
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
          <main className="max-w-[98%] mx-auto px-4 py-6">
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bids"
                element={
                  <ProtectedRoute>
                    <Bids />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bids/new"
                element={
                  <ProtectedRoute roles={['ADMIN', 'MANAGER', 'USER']}>
                    <AddBid />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bids/:id"
                element={
                  <ProtectedRoute>
                    <BidDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bids/:id/edit"
                element={
                  <ProtectedRoute roles={['ADMIN', 'MANAGER', 'USER']}>
                    <EditBid />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/companies"
                element={
                  <ProtectedRoute>
                    <Companies />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/companies/:id"
                element={
                  <ProtectedRoute>
                    <CompanyDetail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/companies/new"
                element={
                  <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                    <AddCompany />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/contacts"
                element={
                  <ProtectedRoute>
                    <Contacts />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/scopes"
                element={
                  <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                    <Scopes />
                  </ProtectedRoute>
                }
              />

              {/* ⬅️ ADMIN PAGE (ADMIN only) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
