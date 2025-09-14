import { Scope } from '@prisma/client'

export function aggregateScopeStatus(scopes: Pick<Scope, 'status'>[]): 'Pending'|'Lost'|'Won'|'Unknown' {
  if (!scopes || scopes.length === 0) return 'Unknown'
  if (scopes.some(s => s.status === 'Pending')) return 'Pending'
  if (scopes.some(s => s.status === 'Lost')) return 'Lost'
  if (scopes.some(s => s.status === 'Won')) return 'Won'
  return 'Unknown'
}

export function totalAmount(scopes: Pick<Scope, 'cost'>[]): number {
  return scopes.reduce((a, s) => a + (s.cost || 0), 0)
}
