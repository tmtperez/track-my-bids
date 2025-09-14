// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding with DB:', process.env.DATABASE_URL)

  // Clean up (order matters due to FKs)
  await prisma.bidTag.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.note.deleteMany()
  await prisma.scope.deleteMany()
  await prisma.bid.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.company.deleteMany()

  // Companies
  const mega = await prisma.company.create({ data: { name: 'MegaCorp' } })
  const luxury = await prisma.company.create({ data: { name: 'Luxury Living' } })
  const shopmart = await prisma.company.create({ data: { name: 'ShopMart' } })
  const innovate = await prisma.company.create({ data: { name: 'Innovate Builders' } })

  // Contacts
  const john = await prisma.contact.create({
    data: { name: 'John Doe', email: 'john.doe@megacorp.com', phone: '555-1234', companyId: mega.id },
  })
  const jane = await prisma.contact.create({
    data: { name: 'Jane Smith', email: 'jane.smith@shopmart.com', phone: '555-5678', companyId: shopmart.id },
  })
  const peter = await prisma.contact.create({
    data: { name: 'Peter Jones', email: 'peter.jones@luxliving.com', phone: '555-9012', companyId: luxury.id },
  })

  // Bids with scopes
  const b1 = await prisma.bid.create({
    data: {
      projectName: 'Downtown Office Complex',
      clientCompanyId: mega.id,
      contactId: john.id,
      proposalDate: new Date('2025-07-10'),
      dueDate: new Date('2025-07-25'),
      jobLocation: 'Metropolis, USA',
      leadSource: 'Referral',
      bidStatus: 'Active',
      scopes: { create: [
        { name: 'Foundation & Concrete', cost: 350000, status: 'Pending' },
        { name: 'Structural Steel', cost: 500000, status: 'Pending' },
      ]},
    },
  })

  const b2 = await prisma.bid.create({
    data: {
      projectName: 'Residential Tower Foundation',
      clientCompanyId: luxury.id,
      contactId: peter.id,
      proposalDate: new Date('2025-05-10'),
      dueDate: new Date('2025-06-20'),
      jobLocation: 'Gotham, USA',
      leadSource: 'Website',
      bidStatus: 'Active',
      scopes: { create: [
        { name: 'Excavation', cost: 300000, status: 'Won' },
        { name: 'Reinforced Concrete', cost: 2200000, status: 'Pending' },
      ]},
    },
  })

  const b3 = await prisma.bid.create({
    data: {
      projectName: 'Mall Expansion Phase 2',
      clientCompanyId: shopmart.id,
      contactId: jane.id,
      proposalDate: new Date('2025-02-02'),
      dueDate: new Date('2025-02-28'),
      jobLocation: 'Star City, USA',
      leadSource: 'Cold Outreach',
      bidStatus: 'Complete',
      scopes: { create: [
        { name: 'Structural Steel', cost: 800000, status: 'Won' },
        { name: 'Foundation & Concrete', cost: 400000, status: 'Lost' },
      ]},
    },
  })

  // Tags
  const fast = await prisma.tag.create({ data: { name: 'fast-track' } })
  const gov  = await prisma.tag.create({ data: { name: 'government' } })
  await prisma.bidTag.create({ data: { bidId: b1.id, tagId: fast.id } })
  await prisma.bidTag.create({ data: { bidId: b2.id, tagId: gov.id } })

  // Optional: seed an admin user, only if the User model exists in your Prisma client
  const hasUserDelegate = (prisma as any).user?.upsert
  if (hasUserDelegate) {
    const passwordHash = await bcrypt.hash('changeme', 12)
    await (prisma as any).user.upsert({
      where: { email: 'admin@demo.local' },
      update: {},
      create: {
        email: 'admin@demo.local',
        name: 'Admin',
        role: 'ADMIN',            // if your User.role is TEXT
        passwordHash: await bcrypt.hash('changeme', 12),
      },
    })
    console.log('Admin user seeded.')
  } else {
    console.log('User model not present; skipping admin user seed.')
  }

  console.log('Seed complete ✅')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
