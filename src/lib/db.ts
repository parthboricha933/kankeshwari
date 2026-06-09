import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbInitPromise: Promise<void> | undefined
}

// Build datasource URL with Neon-optimized connection pooling params
function buildDatasourceUrl(): string {
  let url = process.env.DATABASE_URL || ''
  if (!url) return url

  // Add connection pooling params for Neon serverless if not already present
  if (url.includes('neon.tech') && !url.includes('connection_limit')) {
    const separator = url.includes('?') ? '&' : '?'
    url = `${url}${separator}connection_limit=5&pool_timeout=10`
  }

  return url
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: buildDatasourceUrl(),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// ─── Direct connection pool for DDL operations (bypasses pgbouncer) ───
let ddlPool: Pool | null = null

function getDdlPool(): Pool {
  if (!ddlPool) {
    // Prefer DIRECT_URL, fall back to DATABASE_URL
    // For Neon: derive direct URL from pooled URL if DIRECT_URL not set
    let url = process.env.DIRECT_URL || process.env.DATABASE_URL || ''
    // If using Neon pooled URL but no DIRECT_URL, try to derive direct URL
    if (!process.env.DIRECT_URL && url.includes('-pooler.')) {
      url = url.replace('-pooler.', '.')
      console.log('[DB Init] Derived direct URL from pooled URL')
    }
    const isNeon = url.includes('neon.tech')
    ddlPool = new Pool({
      connectionString: url,
      ssl: isNeon ? { rejectUnauthorized: false } : undefined,
      max: 2,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 10000, // Close idle connections after 10s (Neon cuts at ~5s on free tier)
      allowExitOnIdle: true, // Allow process to exit if pool is idle
    })

    // Handle pool-level errors to prevent uncaught exceptions
    ddlPool.on('error', (err) => {
      console.error('[DB Init] DDL pool error (idle connection):', String(err).substring(0, 200))
    })
  }
  return ddlPool
}

// ─── Individual DDL statements (each is complete, standalone SQL) ───
const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "MenuCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MenuCategory_slug_key" UNIQUE ("slug")
  )`,

  `CREATE TABLE IF NOT EXISTS "MenuItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "badge" TEXT,
    "variantTag" TEXT,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Admin_username_key" UNIQUE ("username")
  )`,

  `CREATE TABLE IF NOT EXISTS "AdminToken" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminToken_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdminToken_token_key" UNIQUE ("token")
  )`,

  `CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "subtotal" INTEGER NOT NULL,
    "gst" INTEGER NOT NULL,
    "packagingCharge" INTEGER NOT NULL DEFAULT 0,
    "deliveryCharge" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "couponCode" TEXT,
    "grandTotal" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'UPI',
    "upiTransactionRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Order_orderId_key" UNIQUE ("orderId")
  )`,

  `CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "RestaurantSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RestaurantSetting_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RestaurantSetting_key_key" UNIQUE ("key")
  )`,

  `CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FLAT',
    "minOrder" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER NOT NULL DEFAULT 0,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Coupon_code_key" UNIQUE ("code")
  )`,
]

// Foreign key statements — executed individually, errors caught
const FK_STATEMENTS = [
  `ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "AdminToken" ADD CONSTRAINT "AdminToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
]

const INDEX_STATEMENTS = [
  `CREATE INDEX IF NOT EXISTS "MenuItem_categoryId_idx" ON "MenuItem"("categoryId")`,
  `CREATE INDEX IF NOT EXISTS "AdminToken_adminId_idx" ON "AdminToken"("adminId")`,
  `CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId")`,
]

// ─── Create tables using direct connection (bypasses pgbouncer) ───
async function createTablesViaDirectConnection(): Promise<boolean> {
  try {
    const pool = getDdlPool()
    const client = await pool.connect()

    try {
      // Create all tables
      for (const sql of DDL_STATEMENTS) {
        try {
          await client.query(sql)
        } catch (e) {
          const msg = String(e)
          if (!msg.includes('already exists')) {
            console.error('[DB Init] Table creation error:', msg.substring(0, 200))
          }
        }
      }

      // Add foreign keys
      for (const sql of FK_STATEMENTS) {
        try {
          await client.query(sql)
        } catch (e) {
          const msg = String(e)
          if (!msg.includes('already exists') && !msg.includes('duplicate')) {
            console.error('[DB Init] FK error:', msg.substring(0, 200))
          }
        }
      }

      // Create indexes
      for (const sql of INDEX_STATEMENTS) {
        try {
          await client.query(sql)
        } catch (e) {
          // Ignore index creation errors
        }
      }

      console.log('[DB Init] Tables created via direct connection')
      return true
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[DB Init] Direct connection failed:', String(error).substring(0, 300))
    return false
  }
}

// ─── Fallback: create tables via Prisma $executeRawUnsafe ───
async function createTablesViaPrisma(): Promise<boolean> {
  try {
    for (const sql of DDL_STATEMENTS) {
      try {
        await db.$executeRawUnsafe(sql)
      } catch (e) {
        const msg = String(e)
        if (!msg.includes('already exists')) {
          console.error('[DB Init] Prisma DDL error:', msg.substring(0, 200))
        }
      }
    }

    // Add foreign keys via Prisma (using individual DO blocks)
    for (const sql of FK_STATEMENTS) {
      try {
        // Wrap in DO block to ignore "already exists" errors
        await db.$executeRawUnsafe(
          `DO $$ BEGIN ${sql}; EXCEPTION WHEN duplicate_object THEN null; END $$;`
        )
      } catch (e) {
        // Ignore FK errors — they may already exist
      }
    }

    // Create indexes
    for (const sql of INDEX_STATEMENTS) {
      try {
        await db.$executeRawUnsafe(sql)
      } catch (e) {
        // Ignore index errors
      }
    }

    console.log('[DB Init] Tables created via Prisma')
    return true
  } catch (error) {
    console.error('[DB Init] Prisma fallback failed:', String(error).substring(0, 200))
    return false
  }
}

// ─── Seed default data ───
async function seedDefaults() {
  try {
    const crypto = await import('crypto')

    // Seed admin if not exists
    const adminCount = await db.admin.count()
    if (adminCount === 0) {
      await db.admin.create({
        data: {
          username: 'admin',
          password: crypto.createHash('sha256').update('bawarchi@2026').digest('hex'),
        },
      })
      console.log('[DB Init] Default admin created')
    }

    // Seed settings if not exists
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
      console.log('[DB Init] Default settings created')
    }

    // Clean up expired admin tokens (prevents table bloat over time)
    try {
      const deleted = await db.adminToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      })
      if (deleted.count > 0) {
        console.log(`[DB Init] Cleaned up ${deleted.count} expired admin token(s)`)
      }
    } catch (tokenCleanupError) {
      // Non-critical - don't block initialization
      console.error('[DB Init] Token cleanup failed:', String(tokenCleanupError).substring(0, 100))
    }
  } catch (seedError) {
    console.error('[DB Init] Seed error:', String(seedError).substring(0, 200))
  }
}

// ─── Retry wrapper for transient database errors ───
const RETRYABLE_ERRORS = [
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'connection',
  'timeout',
  'PGRST',
  'serverless',
  'pgbouncer',
  'too many connections',
  'connection_pool',
  'rate limit',
  '53300', // PostgreSQL: too many connections
  '08006', // PostgreSQL: connection failure
  '08003', // PostgreSQL: connection does not exist
  '57P03', // PostgreSQL: cannot connect now
]

function isRetryableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return RETRYABLE_ERRORS.some(keyword => msg.toLowerCase().includes(keyword.toLowerCase()))
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 1000): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxRetries && isRetryableError(error)) {
        console.log(`[DB] Retry attempt ${attempt + 1}/${maxRetries} after transient error: ${String(error).substring(0, 100)}`)
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)))
        continue
      }
      throw error
    }
  }
  throw lastError
}

// ─── Main initialization function ───
let initAttempts = 0
const MAX_INIT_ATTEMPTS = 3

export async function ensureDatabaseInitialized(): Promise<void> {
  // Use a singleton promise to prevent concurrent initialization
  if (!globalForPrisma.dbInitPromise) {
    globalForPrisma.dbInitPromise = doInitialize()
  }
  return globalForPrisma.dbInitPromise
}

async function doInitialize() {
  try {
    // Quick check: can we query the Admin table?
    await withRetry(() => db.admin.findFirst(), 1, 500)
    // If we get here, tables exist — no need to create
    // Still clean up expired tokens occasionally (every ~10th call)
    initAttempts++
    if (initAttempts % 10 === 0) {
      try {
        await db.adminToken.deleteMany({ where: { expiresAt: { lt: new Date() } } })
      } catch {
        // Non-critical
      }
    }
    return
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (!msg.includes('does not exist') && !msg.includes('table') && !msg.includes('relation') && !msg.includes('invalid')) {
      console.error('[DB Init] Unexpected error checking tables:', msg.substring(0, 200))
      // For unexpected errors (connection issues, etc.), don't try to create tables
      // Reset promise so next request can retry
      globalForPrisma.dbInitPromise = undefined
      return
    }

    console.log('[DB Init] Tables missing, creating...')

    // Reset the init promise so we can retry later if needed
    globalForPrisma.dbInitPromise = undefined

    // Try direct connection first (most reliable for DDL)
    const directOk = await createTablesViaDirectConnection()

    // Fallback to Prisma if direct connection failed
    if (!directOk) {
      await createTablesViaPrisma()
    }

    // Seed defaults
    await seedDefaults()

    console.log('[DB Init] Database initialized successfully')

    // Set the promise to resolved so subsequent calls don't re-initialize
    globalForPrisma.dbInitPromise = Promise.resolve()
  }
}

// ─── Graceful shutdown: close DDL pool ───
if (typeof process !== 'undefined') {
  const shutdown = async () => {
    if (ddlPool) {
      try {
        await ddlPool.end()
        ddlPool = null
        console.log('[DB Init] DDL pool closed')
      } catch {
        // Ignore
      }
    }
    try {
      await db.$disconnect()
      console.log('[DB Init] Prisma disconnected')
    } catch {
      // Ignore
    }
  }

  process.on('beforeExit', shutdown)
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
