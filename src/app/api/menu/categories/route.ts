import { db, ensureDatabaseInitialized } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    await ensureDatabaseInitialized()

    const categories = await db.menuCategory.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()

    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, icon, order } = body

    if (!name || !slug || !icon || order === undefined) {
      return NextResponse.json({ error: 'Name, slug, icon, and order are required' }, { status: 400 })
    }

    const category = await db.menuCategory.create({
      data: { name, slug, icon, order: Number(order) },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating category:', error)
    const message = error instanceof Error && error.message.includes('Unique') ? 'Slug already exists' : 'Failed to create category'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
