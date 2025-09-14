// server/src/middleware/permissions.ts
import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../db.js'

/**
 * Row-level guard for a single bid (:id routes).
 * ADMIN / MANAGER -> full access
 * ESTIMATOR -> can access only if they own it (ownerId === user.id) or when ownerId is null
 * VIEWER -> read-only (GET)
 */

export function requireRole(...roles: Array<'ADMIN'|'MANAGER'|'ESTIMATOR'|'VIEWER'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = req.user;
    if (!u) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(u.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
export async function canAccessBid(req: Request, res: Response, next: NextFunction) {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // Admin / Manager: allow everything
  if (user.role === 'ADMIN' || user.role === 'MANAGER') return next()

  const bidId = Number(req.params.id)
  if (!Number.isFinite(bidId)) return res.status(400).json({ error: 'Invalid id' })

  // Ensure your Bid model has: ownerId Int?   (and migrate)
  // If you haven't added it yet, run:
  //   1) add `ownerId Int?` to Bid in schema.prisma
  //   2) npx prisma migrate dev
  //   3) npx prisma generate
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    select: { ownerId: true }, // relies on Bid.ownerId Int?
  })
  if (!bid) return res.status(404).json({ error: 'Not found' })

  if (user.role === 'ESTIMATOR') {
    // allow the estimator if they own it (or if no owner is set)
    if (!bid.ownerId || bid.ownerId === user.id) return next()
  }

  // Viewers can read only
  if (user.role === 'VIEWER' && req.method === 'GET') return next()

  return res.status(403).json({ error: 'Forbidden' })
}
