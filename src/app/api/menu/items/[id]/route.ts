import { db, ensureDatabaseInitialized } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDatabaseInitialized()

    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, price, badge, variantTag, description, categoryId, order, isAvailable } = body

    const item = await db.menuItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price: Number(price) }),
        ...(badge !== undefined && { badge: badge || null }),
        ...(variantTag !== undefined && { variantTag: variantTag || null }),
        ...(description !== undefined && { description: description || null }),
        ...(categoryId !== undefined && { categoryId }),
        ...(order !== undefined && { order: Number(order) }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDatabaseInitialized()

    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await db.menuItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 400 })
  }
}
