// server/src/middleware/auth.ts
import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

// ⬇️ CHANGE: use "id", not "uid"
export type AuthUser = { id: number; role: 'ADMIN'|'MANAGER'|'ESTIMATOR'|'VIEWER' }

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization
  if (!hdr?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const payload = jwt.verify(hdr.slice(7), process.env.JWT_SECRET!) as AuthUser
    req.user = payload               // payload has { id, role }
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
