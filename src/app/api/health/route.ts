import { db, ensureDatabaseInitialized } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/health — Health check and auto-repair endpoint
// Checks all tables exist, seeds defaults if empty, returns status
export async function GET() {
  const status: Record<string, { ok: boolean; count?: number; error?: string; _note?: string }> = {}

  try {
    // Ensure database is initialized (creates tables if missing)
    await ensureDatabaseInitialized()

    // Check each table
    const checks = [
      { name: 'MenuCategory', fn: () => db.menuCategory.count() },
      { name: 'MenuItem', fn: () => db.menuItem.count() },
      { name: 'Admin', fn: () => db.admin.count() },
      { name: 'AdminToken', fn: () => db.adminToken.count() },
      { name: 'Order', fn: () => db.order.count() },
      { name: 'OrderItem', fn: () => db.orderItem.count() },
      { name: 'RestaurantSetting', fn: () => db.restaurantSetting.count() },
      { name: 'Coupon', fn: () => db.coupon.count() },
    ]

    for (const check of checks) {
      try {
        const count = await check.fn()
        status[check.name] = { ok: true, count }
      } catch (error) {
        status[check.name] = { ok: false, error: String(error).substring(0, 100) }
      }
    }

    // Auto-seed admin if missing
    try {
      const adminCount = await db.admin.count()
      if (adminCount === 0) {
        const crypto = await import('crypto')
        await db.admin.create({
          data: {
            username: 'admin',
            password: crypto.createHash('sha256').update('bawarchi@2026').digest('hex'),
          },
        })
        status.Admin = { ok: true, count: 1, _note: 'Auto-seeded' }
      }
    } catch (_e) {
      // Ignore
    }

    // Auto-seed settings if missing
    try {
      const settingsCount = await db.restaurantSetting.count()
      if (settingsCount === 0) {
        await db.restaurantSetting.createMany({
          data: [
            { key: 'packaging_charge', value: '20', label: 'Packaging Charge' },
            { key: 'delivery_charge', value: '30', label: 'Delivery Charge' },
            { key: 'gst_percent', value: '5', label: 'GST Percentage' },
            { key: 'upi_id', value: 'ruchitpatel.8866-5@oksbi', label: 'UPI ID' },
          ],
        })
        status.RestaurantSetting = { ok: true, count: 4, _note: 'Auto-seeded' }
      }
    } catch (_e) {
      // Ignore
    }

    const allOk = Object.values(status).every(s => s.ok)

    return NextResponse.json({
      success: true,
      healthy: allOk,
      timestamp: new Date().toISOString(),
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        nodeEnv: process.env.NODE_ENV,
      },
      tables: status,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      healthy: false,
      error: String(error).substring(0, 200),
      timestamp: new Date().toISOString(),
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        nodeEnv: process.env.NODE_ENV,
      },
      tables: status,
    }, { status: 500 })
  }
}
