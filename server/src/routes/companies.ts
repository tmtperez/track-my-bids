// routes/companies.ts
import { Router } from 'express'
import { prisma } from '../db.js'

export const companies = Router()

// List companies (unchanged)
companies.get('/', async (_req, res) => {
  const rows = await prisma.company.findMany({
    include: { bids: { include: { scopes: true } } },
    orderBy: { name: 'asc' },
  })

  const mapped = rows.map(c => {
    const projects = c.bids.map(b => ({ id: b.id, name: b.projectName }))
    let won = 0, lost = 0
    for (const b of c.bids) {
      for (const s of b.scopes) {
        if (s.status === 'Won')  won  += s.cost
        if (s.status === 'Lost') lost += s.cost
      }
    }
    return { id: c.id, name: c.name, projects, won, lost }
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
