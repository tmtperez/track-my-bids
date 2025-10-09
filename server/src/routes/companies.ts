// routes/companies.ts
import { Router } from 'express'
import { prisma } from '../db.js'
import multer from 'multer'

export const companies = Router()

const uploadDisk = multer({ dest: 'uploads/' })

// List companies with enhanced metrics
companies.get('/', async (_req, res) => {
  const rows = await prisma.company.findMany({
    include: {
      bids: { include: { scopes: true } },
      accountManager: { select: { id: true, name: true, email: true } },
      contacts: { select: { id: true, name: true, email: true, phone: true, isPrimary: true } },
      companyTags: true,
      _count: {
        select: {
          bids: true,
          contacts: true,
          companyAttachments: true,
          activityLogs: true,
        }
      }
    },
    orderBy: { name: 'asc' },
  })

  const mapped = rows.map(c => {
    const projects = c.bids.map(b => ({ id: b.id, name: b.projectName }))
    let won = 0, lost = 0, totalBidValue = 0
    const activeBids = c.bids.filter(b => b.bidStatus === 'Active').length

    for (const b of c.bids) {
      for (const s of b.scopes) {
        totalBidValue += s.cost
        if (s.status === 'Won')  won  += s.cost
        if (s.status === 'Lost') lost += s.cost
      }
    }

    const avgProjectSize = c.bids.length > 0 ? totalBidValue / c.bids.length : 0

    return {
      id: c.id,
      name: c.name,
      website: c.website,
      address: c.address,
      city: c.city,
      state: c.state,
      zip: c.zip,
      accountManager: c.accountManager,
      relationshipStatus: c.relationshipStatus,
      customerSince: c.customerSince,
      lastContactDate: c.lastContactDate,
      nextFollowUpDate: c.nextFollowUpDate,
      notes: c.notes,
      contacts: c.contacts,
      primaryContact: c.contacts.find(ct => ct.isPrimary),
      tags: c.companyTags.map(t => t.tagName),
      projects,
      won,
      lost,
      totalBidValue,
      avgProjectSize,
      activeBids,
      totalProjects: c.bids.length,
      contactsCount: c._count.contacts,
      attachmentsCount: c._count.companyAttachments,
      activityLogsCount: c._count.activityLogs,
    }
  })

  res.json(mapped)
})

// CREATE company (TS-safe: no `mode`)
companies.post('/', async (req, res) => {
  const name = (req.body?.name ?? '').trim()
  if (!name) return res.status(400).json({ error: 'Name is required' })

  // 1) Try strict match (case-sensitive)
  let exists = await prisma.company.findFirst({
    where: { name: { equals: name } },
  })

  // 2) Fallback: search any partial match, then confirm case-insensitive in JS
  if (!exists) {
    const maybe = await prisma.company.findFirst({
      where: { name: { contains: name } }, // no `mode` here
    })
    if (maybe && maybe.name.toLowerCase() === name.toLowerCase()) {
      exists = maybe
    }
  }

  if (exists) {
    return res.status(409).json({ error: 'Company already exists' })
  }

  const created = await prisma.company.create({ data: { name } })
  res.status(201).json(created)
})

// GET single company by ID
companies.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      bids: { include: { scopes: true } },
      accountManager: { select: { id: true, name: true, email: true } },
      contacts: true,
      companyTags: { orderBy: { createdAt: 'desc' } },
      companyAttachments: { orderBy: { createdAt: 'desc' } },
      activityLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
    }
  })

  if (!company) return res.status(404).json({ error: 'Company not found' })

  // Calculate metrics
  let won = 0, lost = 0, totalBidValue = 0
  const activeBids = company.bids.filter(b => b.bidStatus === 'Active').length

  for (const b of company.bids) {
    for (const s of b.scopes) {
      totalBidValue += s.cost
      if (s.status === 'Won') won += s.cost
      if (s.status === 'Lost') lost += s.cost
    }
  }

  const avgProjectSize = company.bids.length > 0 ? totalBidValue / company.bids.length : 0

  res.json({
    ...company,
    won,
    lost,
    totalBidValue,
    avgProjectSize,
    activeBids,
    totalProjects: company.bids.length,
  })
})

// UPDATE company
companies.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const {
    name,
    website,
    address,
    city,
    state,
    zip,
    accountManagerId,
    relationshipStatus,
    customerSince,
    lastContactDate,
    nextFollowUpDate,
    notes,
  } = req.body

  const updated = await prisma.company.update({
    where: { id },
    data: {
      name: name?.trim(),
      website: website?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zip: zip?.trim() || null,
      accountManagerId: accountManagerId || null,
      relationshipStatus: relationshipStatus?.trim() || null,
      customerSince: customerSince ? new Date(customerSince) : null,
      lastContactDate: lastContactDate ? new Date(lastContactDate) : null,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      notes: notes || null,
    },
    include: {
      accountManager: { select: { id: true, name: true, email: true } },
      contacts: true,
    }
  })

  res.json(updated)
})

// Add tag to company
companies.post('/:id/tags', async (req, res) => {
  const companyId = Number(req.params.id)
  const { tagName } = req.body

  if (!tagName?.trim()) return res.status(400).json({ error: 'Tag name required' })

  const tag = await prisma.companyTag.create({
    data: {
      companyId,
      tagName: tagName.trim(),
    }
  })

  res.status(201).json(tag)
})

// Remove tag from company
companies.delete('/:id/tags/:tagId', async (req, res) => {
  const tagId = Number(req.params.tagId)
  await prisma.companyTag.delete({ where: { id: tagId } })
  res.json({ ok: true })
})

// Upload attachment to company
companies.post('/:id/attachments', uploadDisk.single('file'), async (req, res) => {
  const companyId = Number(req.params.id)
  if (!req.file) return res.status(400).json({ error: 'No file' })

  const uploadedBy = (req as any).user?.email || (req as any).user?.name || 'Unknown'

  const attachment = await prisma.companyAttachment.create({
    data: {
      companyId,
      originalName: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy,
    },
  })

  res.status(201).json(attachment)
})

// Delete attachment
companies.delete('/:id/attachments/:attachmentId', async (req, res) => {
  const attachmentId = Number(req.params.attachmentId)
  await prisma.companyAttachment.delete({ where: { id: attachmentId } })
  res.json({ ok: true })
})

// Add activity log entry
companies.post('/:id/activity', async (req, res) => {
  const companyId = Number(req.params.id)
  const { activityType, description } = req.body

  if (!activityType || !description) {
    return res.status(400).json({ error: 'activityType and description required' })
  }

  const performedBy = (req as any).user?.email || (req as any).user?.name || 'Unknown'

  const log = await prisma.companyActivityLog.create({
    data: {
      companyId,
      activityType,
      description,
      performedBy,
    },
  })

  res.status(201).json(log)
})

// Get activity logs for a company
companies.get('/:id/activity', async (req, res) => {
  const companyId = Number(req.params.id)
  const logs = await prisma.companyActivityLog.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json(logs)
})

// DELETE company
companies.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)

  try {
    // Delete in transaction to handle cascading deletes
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.companyTag.deleteMany({ where: { companyId: id } })
      await tx.companyAttachment.deleteMany({ where: { companyId: id } })
      await tx.companyActivityLog.deleteMany({ where: { companyId: id } })

      // Check if company has bids
      const bidsCount = await tx.bid.count({ where: { clientCompanyId: id } })
      if (bidsCount > 0) {
        throw new Error(`Cannot delete company with ${bidsCount} associated bids. Delete bids first.`)
      }

      // Delete contacts
      await tx.contact.deleteMany({ where: { companyId: id } })

      // Finally delete the company
      await tx.company.delete({ where: { id } })
    })

    res.json({ ok: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Company not found' })
    }
    return res.status(400).json({ error: error.message || 'Failed to delete company' })
  }
})
