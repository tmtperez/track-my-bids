// server/src/middleware/permissions.ts
import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../db.js'

type Role = 'ADMIN' | 'MANAGER' | 'USER'

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
 * For create/update/delete endpoints where ADMIN, MANAGER, and USER can write.
 */
export const writeAccess = requireRole('ADMIN', 'MANAGER', 'USER')

/**
 * Row-level guard for routes like /bids/:id
 *
 * Policy:
 * - ADMIN & MANAGER: full access
 * - USER: can only access their own bids (ownerId check)
 */
export async function canAccessBid(req: Request, res: Response, next: NextFunction) {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const bidId = Number(req.params.id)
  if (!Number.isFinite(bidId)) return res.status(400).json({ error: 'Invalid id' })

  // Ensure the bid exists
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    select: { id: true, ownerId: true },
  })
  if (!bid) return res.status(404).json({ error: 'Not found' })

  // Full access for ADMIN & MANAGER
  if (user.role === 'ADMIN' || user.role === 'MANAGER') {
    return next()
  }

  // USER can only access their own bids
  if (user.role === 'USER') {
    if (bid.ownerId === user.id) return next()
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Default deny
  return res.status(403).json({ error: 'Forbidden' })
}
