// server/routes/bids.ts
import { Router } from 'express';
import { prisma } from '../db.js';
import { aggregateScopeStatus, totalAmount } from '../utils/aggregate.js';
import type { BidInput } from '../types.js';
import { requireRole } from '../middleware/permissions.js';
import { canAccessBid } from '../middleware/permissions.js'; // for read/update by id

export const bids = Router()

// ---------------------------
// Permission helpers (inline)
// ---------------------------
type Role = 'ADMIN' | 'MANAGER' | 'ESTIMATOR' | 'VIEWER'
type Action = 'read' | 'create' | 'update' | 'delete'

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: number; role: Role }
  }
}

const ROLE_PERMS: Record<Role, Action[]> = {
  ADMIN: ['read', 'create', 'update', 'delete'],
  MANAGER: ['read', 'create', 'update'],
  ESTIMATOR: ['read', 'create', 'update'],
  VIEWER: ['read'],
}

function can(req: any, action: Action) {
  const role: Role | undefined = req.user?.role
  if (!role) return false
  return ROLE_PERMS[role]?.includes(action) ?? false
}

function requirePerm(action: Action) {
  return (req: any, res: any, next: any) => {
    if (!can(req, action)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}

// Optional: redaction for low-privilege viewers
function redactForViewer<T extends Record<string, any>>(req: any, rows: T[]) {
  if (req.user?.role !== 'VIEWER') return rows
  return rows.map(row => ({
    ...row,
    amount: null,
    scopes: undefined,
  }))
}

// ---------------------------------------------------------------------------
// List bids (status/search/date-range)
//   - status=Active|Complete|Archived|Hot|Cold
//   - search=string
//   - createdFrom=YYYY-MM-DD
//   - createdTo=YYYY-MM-DD
// ---------------------------------------------------------------------------
bids.get('/', requirePerm('read'), async (req, res, next) => {
  try {
    const status = (req.query.status as string) || undefined
    const search = ((req.query.search as string) || '').trim()
    const createdFrom = (req.query.createdFrom as string) || undefined
    const createdTo   = (req.query.createdTo as string) || undefined

    const where: any = {}
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
      },
      orderBy: { updatedAt: 'desc' },
    })

    let mapped = results.map(b => ({
      id: b.id,
      projectName: b.projectName,
      clientName: b.clientCompany?.name ?? '—',
      amount: totalAmount(b.scopes),
      proposalDate: b.proposalDate ?? null,
      dueDate: b.dueDate ?? null,
      followUpOn: b.followUpOn ?? null,     // NEW
      scopeStatus: aggregateScopeStatus(b.scopes),
      bidStatus: b.bidStatus,
    }))

    mapped = redactForViewer(req, mapped)
    res.json(mapped)
  } catch (err) {
    next(err)
  }
})

// ---------------------------------------------------------------------------
// Get one bid with full details
// ---------------------------------------------------------------------------
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
      },
    })

    if (!b) return res.status(404).json({ error: 'Not found' })

    if (req.user?.role === 'VIEWER') {
      const redacted = {
        ...b,
        scopes: undefined,
      }
      return res.json(redacted)
    }

    res.json(b)
  } catch (err) {
    next(err)
  }
})

// ---------------------------------------------------------------------------
// Create a bid
// ---------------------------------------------------------------------------
bids.post('/', requireRole('ADMIN','MANAGER','ESTIMATOR'), async (req, res, next) => {
  try {
    const bid = await prisma.bid.create({
      data: {
        projectName: req.body.projectName,
        clientCompanyId: req.body.clientCompanyId,
        contactId: req.body.contactId ?? null,
        proposalDate: req.body.proposalDate ? new Date(req.body.proposalDate) : null,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        followUpOn: req.body.followUpOn ? new Date(req.body.followUpOn) : null, // NEW
        jobLocation: req.body.jobLocation ?? null,
        leadSource: req.body.leadSource ?? null,
        bidStatus: req.body.bidStatus, // allow 'Hot' | 'Cold'
        scopes: {
          create: (req.body.scopes || []).map((s: any) => ({
            name: s.name,
            cost: s.cost,
            status: s.status,
          })),
        },
      },
      include: { scopes: true },
    })
    res.json(bid)
  } catch (e) {
    next(e)
  }
})

// ---------------------------------------------------------------------------
// Update a bid (replaces scopes for simplicity)
// ---------------------------------------------------------------------------
bids.put(
  '/:id',
  canAccessBid,
  requireRole('ADMIN','MANAGER','ESTIMATOR'),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const data = req.body as BidInput;

      await prisma.scope.deleteMany({ where: { bidId: id } });

      const updated = await prisma.bid.update({
        where: { id },
        data: {
          projectName: data.projectName,
          clientCompanyId: data.clientCompanyId,
          contactId: data.contactId || null,
          proposalDate: data.proposalDate ? new Date(data.proposalDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          followUpOn: data.followUpOn ? new Date(data.followUpOn) : null, // NEW
          jobLocation: data.jobLocation || null,
          leadSource: data.leadSource || null,
          bidStatus: data.bidStatus,
          scopes: {
            create: data.scopes.map(s => ({
              name: s.name,
              cost: s.cost,
              status: s.status,
            })),
          },
        },
        include: { scopes: true },
      });

      res.json(updated);
    } catch (e) {
      next(e)
    }
  }
);
