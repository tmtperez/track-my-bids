import { Router } from 'express'
import multer from 'multer'
import { parseImportCSV } from '../utils/csv.js'
import { prisma } from '../db.js'

export const importer = Router()
const upload = multer({ storage: multer.memoryStorage() })

import path from 'path'
import fs from 'fs'

// Upload attachments to /uploads
const uploadDisk = multer({ dest: 'uploads/' })

// CSV import
importer.post('/bids', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  const rows = parseImportCSV(req.file.buffer)

  const grouped: Record<string, any> = {}
  for (const r of rows) {
    const key = `${r.projectName}||${r.clientCompany}`
    grouped[key] = grouped[key] || {
      projectName: r.projectName,
      clientCompany: r.clientCompany,
      contactName: r.contactName,
      proposalDate: r.proposalDate,
      dueDate: r.dueDate,
      jobLocation: r.jobLocation,
      leadSource: r.leadSource,
      bidStatus: r.bidStatus,
      scopes: []
    }
    grouped[key].scopes.push({ name: r.scopeName, cost: r.scopeCost, status: r.scopeStatus })
  }

  const results: any[] = []
  for (const key of Object.keys(grouped)) {
    const g = grouped[key]
    let company = await prisma.company.findFirst({ where: { name: g.clientCompany } })
    if (!company) company = await prisma.company.create({ data: { name: g.clientCompany } })

    let contact = g.contactName
      ? await prisma.contact.findFirst({ where: { name: g.contactName, companyId: company.id } })
      : null
    if (!contact && g.contactName) {
      contact = await prisma.contact.create({ data: { name: g.contactName, companyId: company.id } })
    }

    const created = await prisma.bid.create({
      data: {
        projectName: g.projectName,
        clientCompanyId: company.id,
        contactId: contact?.id || null,
        proposalDate: g.proposalDate,
        dueDate: g.dueDate,
        jobLocation: g.jobLocation || null,
        leadSource: g.leadSource || null,
        bidStatus: g.bidStatus || 'Active',
        scopes: { create: g.scopes }
      }
    })
    results.push(created)
  }

  res.json({ imported: results.length })
})

// Attachment upload
importer.post('/bids/:id/attachments', uploadDisk.single('file'), async (req, res) => {
  const id = Number(req.params.id)
  if (!req.file) return res.status(400).json({ error: 'No file' })
  const created = await prisma.attachment.create({
    data: {
      bidId: id,
      originalName: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size
    }
  })
  res.json(created)
})
