import { db, ensureDatabaseInitialized } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDatabaseInitialized()

    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized - please log in again' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, slug, icon, order } = body

    const category = await db.menuCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(icon !== undefined && { icon }),
        ...(order !== undefined && { order: Number(order) }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    const message = error instanceof Error ? error.message : 'Failed to update category'
    return NextResponse.json({ error: message.includes('Record to update not found') ? 'Category not found' : 'Failed to update category' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDatabaseInitialized()

    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized - please log in again' }, { status: 401 })
    }

    const { id } = await params

    await db.menuCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete category'
    return NextResponse.json({ error: message.includes('Record to delete not found') ? 'Category not found' : 'Failed to delete category' }, { status: 400 })
  }
}
