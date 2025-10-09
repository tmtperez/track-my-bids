// server/src/routes/auth.ts
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { prisma } from '../db.js'

export const auth = Router()

auth.post('/login', async (req, res) => {
  const { email, password } = req.body

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    // Find user by email
    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, role: true, passwordHash: true }
    })

    if (!dbUser) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Verify password
    if (!dbUser.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValidPassword = await bcrypt.compare(password, dbUser.passwordHash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // 🔧 normalize secret here too (must match verify)
    const secret = (process.env.JWT_SECRET || '').trim()
    if (!secret) {
      return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET missing' })
    }

    const payload = { id: dbUser.id, role: dbUser.role }
    const token = jwt.sign(payload, secret, { expiresIn: '7d' })

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({ ok: true, user: payload, token })
  } catch (error) {
    console.error('[LOGIN ERROR]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
