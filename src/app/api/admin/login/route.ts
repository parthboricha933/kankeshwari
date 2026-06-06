import { db } from '@/lib/db'
import { hashPassword, verifyPassword, createToken } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

// Default admin credentials to auto-seed if no admin exists
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'bavarchi2025',
}

async function ensureAdminExists() {
  const adminCount = await db.admin.count()
  if (adminCount === 0) {
    await db.admin.create({
      data: {
        username: DEFAULT_ADMIN.username,
        password: hashPassword(DEFAULT_ADMIN.password),
      },
    })
    console.log('[Auto-seed] Default admin user created')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auto-seed admin if no admin exists
    await ensureAdminExists()

    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const admin = await db.admin.findUnique({
      where: { username },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = verifyPassword(password, admin.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createToken(admin.id)

    const response = NextResponse.json({
      success: true,
      token,
      admin: { id: admin.id, username: admin.username },
    })

    // Set cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error logging in:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
