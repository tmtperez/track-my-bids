// server/routes/bids.ts
import { Router } from 'express'
import { prisma } from '../db.js'
import { aggregateScopeStatus, totalAmount } from '../utils/aggregate.js'
import type { BidInput } from '../types.js'
import { requireRole } from '../middleware/permissions.js'
import { canAccessBid } from '../middleware/permissions.js'
import { authRequired } from '../middleware/auth.js'

export const bids = Router()

// All bid routes require a valid JWT (req.user populated)
bids.use(authRequired)

/* ---------------------------
   Permission helpers (inline)
---------------------------- */
type Role = 'ADMIN' | 'MANAGER' | 'USER'
type Action = 'read' | 'create' | 'update' | 'delete'

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: number; role: Role }
  }
}

const ROLE_PERMS: Record<Role, Action[]> = {
  ADMIN:     ['read', 'create', 'update', 'delete'],
  MANAGER:   ['read', 'create', 'update', 'delete'],
  USER:      ['read', 'create', 'update', 'delete'],
}

function can(req: any, action: Action) {
  const role: Role | undefined = req.user?.role
  if (!role) return false
  return ROLE_PERMS[role]?.includes(action) ?? false
}

function requirePerm(action: Action) {
  return (req: any, res: any, next: any) => {
    if (!can(req, action)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

/* ---------------------------
   Helpers
---------------------------- */
const parseDateOrNull = (v: any) => (v ? new Date(v) : null)

type ScopeIn = { name?: string; cost?: any; status?: any }
const VALID_SCOPE_STATUS = new Set(['Pending', 'Won', 'Lost'])

function sanitizeScopes(raw: ScopeIn[] | undefined | null) {
  if (!raw || !Array.isArray(raw)) return []
  return raw
    .map(s => ({
      name: String(s.name ?? '').trim(),
      cost: Number(s.cost ?? 0) || 0,
      status: VALID_SCOPE_STATUS.has(String(s.status))
        ? (String(s.status) as 'Pending' | 'Won' | 'Lost')
        : 'Pending',
    }))
    .filter(s => s.name.length > 0)
}

/* ---------------------------------------------------------------------------
   GET /bids
--------------------------------------------------------------------------- */
bids.get('/', requirePerm('read'), async (req, res, next) => {
  try {
    const status = (req.query.status as string) || undefined
    const search = ((req.query.search as string) || '').trim()
    const createdFrom = (req.query.createdFrom as string) || undefined
    const createdTo   = (req.query.createdTo as string) || undefined

    const where: any = {}

    // USER role can only see their own bids
    if (req.user?.role === 'USER') {
      where.ownerId = req.user.id
    }

    if (status) where.bidStatus = status

    if (search) {
      where.OR = [
        { projectName: { contains: search } },
        { clientCompany: { is: { name: { contains: search } } } },
        { contact: { is: { name: { contains: search } } } },
      ]
    }

    if (createdFrom || createdTo) {
      where.createdAt = {}
      if (createdFrom) where.createdAt.gte = new Date(createdFrom)
      if (createdTo)   where.createdAt.lte = new Date(createdTo)
    }

    const results = await prisma.bid.findMany({
      where,
      select: {
        id: true,
        projectName: true,
        proposalDate: true,
        dueDate: true,
        followUpOn: true,
        bidStatus: true,
        clientCompany: true,
        contact: true,
        scopes: true,
        estimator: { select: { id: true, name: true, email: true } },
        lastModifiedBy: { select: { id: true, name: true, email: true } },
        lastModifiedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    const mapped = results.map(b => ({
      id: b.id,
      projectName: b.projectName,
      clientName: b.clientCompany?.name ?? '—',
      amount: totalAmount(b.scopes),
      proposalDate: b.proposalDate ?? null,
      dueDate: b.dueDate ?? null,
      followUpOn: b.followUpOn ?? null,
      scopeStatus: aggregateScopeStatus(b.scopes),
      bidStatus: b.bidStatus,
      estimator: b.estimator,
      lastModifiedBy: b.lastModifiedBy,
      lastModifiedAt: b.lastModifiedAt,
    }))

    res.json(mapped)
  } catch (err) {
    next(err)
  }
})

/* ---------------------------------------------------------------------------
   GET /bids/:id
--------------------------------------------------------------------------- */
bids.get('/:id', requirePerm('read'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })

    const b = await prisma.bid.findUnique({
      where: { id },
      include: {
        clientCompany: true,
        contact: true,
        scopes: true,
        notes: true,
        tags: { include: { tag: true } },
        attachments: true,
        estimator: { select: { id: true, name: true, email: true } },
        lastModifiedBy: { select: { id: true, name: true, email: true } },
      },
    })

    if (!b) return res.status(404).json({ error: 'Not found' })

    // USER role can only see their own bids
    if (req.user?.role === 'USER' && b.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    res.json(b)
  } catch (err) {
    next(err)
  }
})

/* ---------------------------------------------------------------------------
   POST /bids  (ADMIN, MANAGER, USER)
--------------------------------------------------------------------------- */
bids.post('/', requireRole('ADMIN','MANAGER','USER'), async (req, res, next) => {
  try {
    const scopes = sanitizeScopes(req.body.scopes)

    const bid = await prisma.bid.create({
      data: {
        projectName: String(req.body.projectName ?? '').trim(),
        clientCompanyId: req.body.clientCompanyId,
        contactId: req.body.contactId ?? null,
        estimatorId: req.body.estimatorId ?? null,
        proposalDate: parseDateOrNull(req.body.proposalDate),
        dueDate: parseDateOrNull(req.body.dueDate),
        followUpOn: parseDateOrNull(req.body.followUpOn),
        jobLocation: req.body.jobLocation ?? null,
        leadSource: req.body.leadSource ?? null,
        bidStatus: req.body.bidStatus,
        lastModifiedById: req.user?.id,
        lastModifiedAt: new Date(),
        scopes: {
          create: scopes.map(s => ({
            name: s.name,
            cost: s.cost,
            status: s.status,
          })),
        },
      },
      include: { scopes: true },
    })

    res.status(201).json(bid)
  } catch (e) {
    next(e)
  }
})

/* ---------------------------------------------------------------------------
   PUT /bids/:id  — replace scopes atomically
   (ADMIN, MANAGER, USER)
--------------------------------------------------------------------------- */
bids.put('/:id', canAccessBid, requireRole('ADMIN','MANAGER','USER'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })

    const data = req.body as BidInput
    const scopes = sanitizeScopes(data.scopes)

    const [, updated] = await prisma.$transaction([
      prisma.scope.deleteMany({ where: { bidId: id } }),
      prisma.bid.update({
        where: { id },
        data: {
          projectName: String(data.projectName ?? '').trim(),
          clientCompanyId: data.clientCompanyId,
          contactId: data.contactId || null,
          estimatorId: data.estimatorId || null,
          proposalDate: parseDateOrNull(data.proposalDate),
          dueDate: parseDateOrNull(data.dueDate),
          followUpOn: parseDateOrNull(data.followUpOn),
          jobLocation: data.jobLocation || null,
          leadSource: data.leadSource || null,
          bidStatus: data.bidStatus,
          lastModifiedById: req.user?.id,
          lastModifiedAt: new Date(),
          scopes: {
            create: scopes.map(s => ({
              name: s.name,
              cost: s.cost,
              status: s.status,
            })),
          },
        },
        include: { scopes: true },
      }),
    ])

    res.json(updated)
  } catch (e) {
    next(e)
  }
})

/* ---------------------------------------------------------------------------
   DELETE /bids/:id  (ADMIN, MANAGER, USER)
--------------------------------------------------------------------------- */
bids.delete('/:id', requireRole('ADMIN','MANAGER','USER'), async (req, res, next) => {
  try {
    const id = Number.parseInt(String(req.params.id), 10)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })

    // Check if bid exists and user has access
    const bid = await prisma.bid.findUnique({ where: { id } })
    if (!bid) {
      return res.status(404).json({ error: 'Not found' })
    }

    // USER role can only delete their own bids
    if (req.user?.role === 'USER' && bid.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Clean children first, then delete the bid using deleteMany (won't throw)
    await prisma.$transaction(async (tx) => {
      await tx.scope.deleteMany({ where: { bidId: id } })
      await tx.note.deleteMany({ where: { bidId: id } })
      await tx.attachment.deleteMany({ where: { bidId: id } })
      await tx.bidTag.deleteMany({ where: { bidId: id } })
      await tx.bid.delete({ where: { id } })
    })

    res.status(204).end()
  } catch (e) {
    next(e)
  }
})


export default bids
