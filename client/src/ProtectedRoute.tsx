// client/src/ProtectedRoute.tsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from './state/AuthContext'

export function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: string[]
}) {
  const { user } = React.useContext(AuthContext)

  if (!user) return <Navigate to="/login" replace />

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
