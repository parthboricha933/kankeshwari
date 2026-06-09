import { db, ensureDatabaseInitialized } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()

    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, price, badge, variantTag, description, categoryId, order, isAvailable } = body

    if (!name || price === undefined || !categoryId || order === undefined) {
      return NextResponse.json({ error: 'Name, price, categoryId, and order are required' }, { status: 400 })
    }

    const item = await db.menuItem.create({
      data: {
        name,
        price: Number(price),
        badge: badge || null,
        variantTag: variantTag || null,
        description: description || null,
        categoryId,
        order: Number(order),
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 400 })
  }
}
