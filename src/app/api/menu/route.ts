import { db, ensureDatabaseInitialized } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await ensureDatabaseInitialized()

    const categories = await db.menuCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching menu:', error)
    // Return empty array as fallback so the site doesn't crash
    return NextResponse.json([])
  }
}
