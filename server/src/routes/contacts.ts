import { Router } from 'express'
import { prisma } from '../db.js'

export const contacts = Router()

contacts.get('/', async (_req, res) => {
  const list = await prisma.contact.findMany({
    include: { company: true },
    orderBy: { name: 'asc' }
  })
  res.json(
    list.map(c => ({
      id: c.id,
      name: c.name,
      title: c.title ?? null,
      email: c.email,
      phone: c.phone,
      company: { id: c.company.id, name: c.company.name }
    }))
  )
})

contacts.post('/', async (req, res) => {
  const { name, title, email, phone, companyId } = req.body
  const created = await prisma.contact.create({
    data: {
      name,
      title: title ?? null,
      email,
      phone,
      companyId: Number(companyId)
    }
  })
  res.json(created)
})

contacts.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { name, title, email, phone, companyId } = req.body
  const updated = await prisma.contact.update({
    where: { id },
    data: {
      name,
      title: title ?? null,
      email,
      phone,
      companyId: Number(companyId)
    }
  })
  res.json(updated)
})

// DELETE contact
contacts.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)

  try {
    // Check if contact is used in any bids
    const bidsCount = await prisma.bid.count({ where: { contactId: id } })
    if (bidsCount > 0) {
      return res.status(400).json({
        error: `Cannot delete contact with ${bidsCount} associated bids. Remove contact from bids first.`
      })
    }

    await prisma.contact.delete({ where: { id } })
    res.json({ ok: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contact not found' })
    }
    return res.status(400).json({ error: error.message || 'Failed to delete contact' })
  }
})
