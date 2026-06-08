import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbInitialized: boolean | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// SQL statements to create all required tables if they don't exist
const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS "MenuCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MenuCategory_slug_key" UNIQUE ("slug")
);

CREATE TABLE IF NOT EXISTS "MenuItem" (
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
);

CREATE TABLE IF NOT EXISTS "Admin" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Admin_username_key" UNIQUE ("username")
);

CREATE TABLE IF NOT EXISTS "AdminToken" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminToken_token_key" UNIQUE ("token")
);

CREATE TABLE IF NOT EXISTS "Order" (
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
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RestaurantSetting" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RestaurantSetting_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RestaurantSetting_key_key" UNIQUE ("key")
);

CREATE TABLE IF NOT EXISTS "Coupon" (
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
);

DO $$ BEGIN
  ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AdminToken" ADD CONSTRAINT "AdminToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");
CREATE INDEX IF NOT EXISTS "AdminToken_adminId_idx" ON "AdminToken"("adminId");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
`

// Auto-initialize database: create tables if they don't exist
export async function ensureDatabaseInitialized() {
  if (globalForPrisma.dbInitialized) return

  try {
    // Quick check if a core table exists
    await db.admin.findFirst()
    globalForPrisma.dbInitialized = true
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('does not exist') || msg.includes('table') || msg.includes('relation') || msg.includes('invalid')) {
      console.log('[DB Init] Tables missing, creating with raw SQL...')
      try {
        // Execute each statement separately for better error handling
        const statements = CREATE_TABLES_SQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'))

        for (const stmt of statements) {
          try {
            await db.$executeRawUnsafe(stmt + ';')
          } catch (execError: unknown) {
            const execMsg = execError instanceof Error ? execError.message : String(execError)
            // Ignore "already exists" errors
            if (!execMsg.includes('already exists') && !execMsg.includes('duplicate')) {
              console.error('[DB Init] SQL Error:', execMsg.substring(0, 200))
            }
          }
        }

        console.log('[DB Init] Tables created, seeding defaults...')
        await seedDefaults()
        globalForPrisma.dbInitialized = true
        console.log('[DB Init] Database initialized successfully')
      } catch (pushError) {
        console.error('[DB Init] Failed to create tables:', pushError)
      }
    } else {
      console.error('[DB Init] Unexpected error:', msg.substring(0, 200))
    }
  }
}

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
  } catch (seedError) {
    console.error('[DB Init] Seed error:', seedError)
  }
}
