import { verifyToken, getAdminFromToken, getTokenFromRequest } from '@/lib/admin-auth'
import { ensureDatabaseInitialized } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()

    const token = await getTokenFromRequest(request)

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const isValid = await verifyToken(token)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const admin = await getAdminFromToken(token)

    return NextResponse.json({
      valid: true,
      admin: admin ? { id: admin.id, username: admin.username } : null,
    })
  } catch (error) {
    console.error('Error verifying token:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
