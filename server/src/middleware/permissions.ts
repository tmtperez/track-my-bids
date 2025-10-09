// server/src/middleware/permissions.ts
import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../db.js'

type Role = 'ADMIN' | 'MANAGER' | 'ESTIMATOR' | 'VIEWER'

/**
 * Gate by role list. Returns 403 if req.user.role not included.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = req.user
    if (!u) return res.status(401).json({ error: 'Unauthorized' })
    if (!roles.includes(u.role)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

/**
 * writeAccess:
 * For create/update/delete endpoints where only ADMIN & ESTIMATOR should pass.
 * (Viewer is read-only; Manager optional — keep out to match your policy.)
 */
export const writeAccess = requireRole('ADMIN', 'ESTIMATOR')

/**
 * Row-level guard for routes like /bids/:id
 *
 * Your requested policy:
 * - ADMIN: full
 * - ESTIMATOR: full
 * - VIEWER: read-only (GET only)
 *
 * MANAGER: (optional) If you still use MANAGER elsewhere, treat like read-only here
 *          or add to allow list below as you prefer.
 */
export async function canAccessBid(req: Request, res: Response, next: NextFunction) {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const bidId = Number(req.params.id)
  if (!Number.isFinite(bidId)) return res.status(400).json({ error: 'Invalid id' })

  // Ensure the bid exists (prevents leaking 200/404 differences by role)
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    select: { id: true }, // ownerId not needed now since estimator is full access
  })
  if (!bid) return res.status(404).json({ error: 'Not found' })

  // Full access for ADMIN & ESTIMATOR
  if (user.role === 'ADMIN' || user.role === 'ESTIMATOR') {
    return next()
  }

  // VIEWER is read-only (GET only)
  if (user.role === 'VIEWER') {
    if (req.method === 'GET') return next()
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Default for any other role (e.g., MANAGER if present): read-only
  if (req.method === 'GET') return next()
  return res.status(403).json({ error: 'Forbidden' })
}
