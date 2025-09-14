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
      email: c.email,
      phone: c.phone,
      company: { id: c.company.id, name: c.company.name }
    }))
  )
})

contacts.post('/', async (req, res) => {
  const { name, email, phone, companyId } = req.body
  const created = await prisma.contact.create({
    data: { name, email, phone, companyId: Number(companyId) }
  })
  res.json(created)
})

contacts.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { name, email, phone, companyId } = req.body
  const updated = await prisma.contact.update({
    where: { id },
    data: { name, email, phone, companyId: Number(companyId) }
  })
  res.json(updated)
})
