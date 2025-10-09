import React from 'react'
import { postJSON, setAuthToken } from '../lib/api'

export type User = {
  id: number
  name: string
  role: 'ADMIN' | 'MANAGER' | 'USER'
}

type AuthCtx = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = React.createContext<AuthCtx>({
  user: null,
  login: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(() => {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as User) : null
  })

  // Hydrate token for the API helper on first load
  React.useEffect(() => {
    const tok = localStorage.getItem('auth_token')
    setAuthToken(tok)
  }, [])

  async function login(email: string, password: string) {
    // Use API helper so the base URL is always VITE_API_URL
    const { token, user } = await postJSON<{ token: string; user: User }>(
      '/auth/login',
      { email, password }
    )

    // Persist + hydrate API helper
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setAuthToken(token)
    setUser(user)
  }

  function logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setAuthToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
