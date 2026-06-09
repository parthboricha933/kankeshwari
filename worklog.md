---
Task ID: 1
Agent: Main
Task: Fix recurring "internal error" and admin panel not working - PERMANENT FIX

Work Log:
- Investigated all API routes, db.ts, admin-auth.ts, package.json, .env
- Found 6 critical bugs causing the recurring internal error:
  1. SQL splitting bug in ensureDatabaseInitialized() - splitting by `;` broke DO $$ blocks and foreign key creation
  2. Missing ensureDatabaseInitialized() in 8+ API routes (verify, coupons, categories, items, orders, etc.)
  3. Settings key mismatch: DB stores `gst_percent` but admin panel reads/writes `gst_percentage`
  4. `prisma db push 2>/dev/null || true` silently swallowed all errors in postinstall
  5. DDL via pgbouncer - $executeRawUnsafe went through Neon's pgbouncer which may not reliably handle DDL
  6. No auto-repair mechanism - once tables broke, nothing fixed them

- Rewrote db.ts with:
  - pg Pool with DIRECT_URL for DDL operations (bypasses pgbouncer)
  - Auto-derives direct URL from pooled URL if DIRECT_URL not set
  - Individual DDL statements (no splitting) - each CREATE TABLE, ADD CONSTRAINT, CREATE INDEX is standalone
  - Fallback to Prisma $executeRawUnsafe if direct connection fails
  - DO blocks for FK creation in Prisma fallback (properly formatted)
  - Singleton promise pattern to prevent concurrent initialization
  - Seed defaults (admin + settings) after table creation

- Fixed all API routes: added ensureDatabaseInitialized() to every route
- Fixed settings key mismatch: admin panel now uses gst_percent consistently
- Fixed package.json postinstall: errors now visible instead of suppressed
- Added /api/health endpoint for diagnostics and auto-repair
- Added fallback defaults in orders API for charges
- Menu data is NEVER deleted - seed only runs when < 8 categories exist

Stage Summary:
- All 20 files modified and pushed to GitHub (dfca6e8)
- Vercel deployment triggered automatically
- Admin credentials: admin / bawarchi@2026
- Health check endpoint: /api/health (shows table status, env vars, auto-seeds missing data)
