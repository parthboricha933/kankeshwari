# 🍽️ Bawarchi — The Indian Cuisine Restaurant, Diu

> **100% Pure Vegetarian Restaurant** located in Diu, India. A modern restaurant website with online ordering, party packages, and admin management.

---

## 🌐 Live Website

**[https://bawarchirestaurantdiu.com](https://bawarchirestaurantdiu.com)**

---

## ✨ Features

### Customer-Facing
- **Interactive Menu** — Browse categories (Chinese, Paneer, Sweet, Vegetables, Dal & Rice, Tandoor, Fix Meal) with real-time availability
- **Cart System** — Add items, adjust quantities, apply coupon codes
- **UPI Payment** — Direct UPI intent payment integration
- **WhatsApp Ordering** — Confirm orders directly via WhatsApp
- **Coupon System** — Discoverable coupon chips in cart with flat/percentage discounts
- **Party Packages** — 4 curated packages (₹375–₹550 + GST) for weddings, birthdays, corporate events
- **Table Reservation** — Reserve tables via WhatsApp form
- **Gallery** — Masonry photo gallery with lightbox viewer
- **GST Notice** — Prominent GST applicability banner in footer
- **Fully Responsive** — Mobile-first design with hamburger menu

### Admin Panel (`/admin`)
- **Secure Login** — Token-based authentication
- **Category Management** — Create, edit, delete, reorder menu categories
- **Item Management** — Add/edit items with price, badge (Best Seller / Signature / Must Try), variant tags, availability toggle
- **Charge Settings** — Configure packaging charges, delivery charges, GST %
- **Coupon Management** — Create/edit coupons with code, discount type, min order, expiry, usage limits
- **Order Management** — View and confirm orders

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Frontend** | Custom CSS (Cormorant Garamond + DM Sans), served via iframe |
| **Admin UI** | React 19 + Tailwind CSS 4 + shadcn/ui (Radix) |
| **Database** | PostgreSQL (Neon Serverless) |
| **ORM** | Prisma 6 |
| **Icons** | Font Awesome 6.5 |
| **Payments** | UPI Intent (GPay, PhonePe, Paytm) |
| **Messaging** | WhatsApp (wa.me) |
| **Hosting** | Vercel |
| **Domain** | bawarchirestaurantdiu.com |

---

## 📁 Project Structure

```
├── public/
│   ├── sea-cafe-diu.html          # Main restaurant website (single-page)
│   ├── party-packages.html        # Party Packages page
│   ├── robots.txt                 # SEO robots
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (metadata, fonts)
│   │   ├── page.tsx               # Homepage (iframe to sea-cafe-diu.html)
│   │   ├── globals.css            # Tailwind + theme variables
│   │   ├── admin/
│   │   │   └── page.tsx           # Admin panel SPA
│   │   ├── party-packages/
│   │   │   └── page.tsx           # Party Packages (iframe)
│   │   └── api/
│   │       ├── menu/              # Menu CRUD (categories, items)
│   │       ├── orders/            # Order management
│   │       ├── coupons/           # Coupon CRUD + validate + available
│   │       ├── settings/          # Restaurant settings
│   │       └── admin/             # Admin auth (login, verify)
│   ├── components/ui/             # 50+ shadcn/ui components
│   ├── hooks/                     # Custom React hooks
│   └── lib/
│       ├── prisma.ts              # Prisma client singleton
│       ├── db.ts                  # Database connection
│       ├── admin-auth.ts          # Admin auth utilities
│       └── utils.ts               # Utility functions
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── seed.ts                    # Database seeder
├── .env                           # Environment variables (not committed)
└── package.json
```

---

## 🗄️ Database Schema

| Model | Description |
|-------|------------|
| `MenuCategory` | Menu categories (name, slug, icon, order) |
| `MenuItem` | Individual menu items (price, badge, variant, availability) |
| `Admin` | Admin users (username, password) |
| `AdminToken` | Session tokens for admin auth |
| `Order` | Customer orders (subtotal, GST, charges, status) |
| `OrderItem` | Line items within an order |
| `RestaurantSetting` | Key-value settings (GST %, charges, UPI ID) |
| `Coupon` | Discount coupons (code, type, min order, expiry) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/parthboricha933/kankeshwari.git
cd kankeshwari

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and other settings

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Run the development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"
UPI_ID="your-upi-id@oksbi"
UPI_PAYEE_NAME="Bawarchi Restaurant"
```

---

## 🔑 Admin Access

Navigate to `/admin` on the live website.

| Field | Value |
|-------|-------|
| **URL** | `https://bawarchirestaurantdiu.com/admin` |
| **Username** | `admin` |
| **Password** | `bavarchi2025` |

> ⚠️ Change the default password after first login in production.

---

## 🎨 Design System

The main website uses a custom design system:

| Token | Value | Usage |
|-------|-------|-------|
| `--ocean` | `#0a4f6e` | Primary brand color |
| `--ocean-mid` | `#1a7a9c` | Hover states |
| `--ocean-light` | `#4ab4d8` | Light accents |
| `--sunset` | `#e07b39` | CTA / accent buttons |
| `--sunset-warm` | `#f4a35a` | Warm accents |
| `--coral` | `#d95f3b` | Prices, hover states |
| `--off-white` | `#faf8f4` | Main background |
| `--dark` | `#1a1a2e` | Footer, gallery background |
| `--font-display` | Cormorant Garamond | Headings |
| `--font-body` | DM Sans | Body text |

---

## 📱 Pages & Routes

| Route | Description |
|-------|------------|
| `/` | Main restaurant website (single-page scroll) |
| `/party-packages` | Party packages with 4 tiers + comparison table |
| `/admin` | Admin panel (menu, orders, coupons, settings) |
| `/api/menu` | GET all menu categories + items |
| `/api/menu/categories` | POST create category |
| `/api/menu/categories/[id]` | PUT / DELETE category |
| `/api/menu/items` | POST create item |
| `/api/menu/items/[id]` | PUT / DELETE item |
| `/api/orders` | GET / POST orders |
| `/api/orders/[id]` | GET order details |
| `/api/orders/[id]/confirm` | PUT confirm order |
| `/api/coupons` | GET / POST coupons |
| `/api/coupons/[id]` | PUT / DELETE coupon |
| `/api/coupons/validate` | POST validate coupon code |
| `/api/coupons/available` | GET active public coupons |
| `/api/settings` | GET / PUT restaurant settings |
| `/api/admin/login` | POST admin login |
| `/api/admin/verify` | POST verify admin token |

---

## 📦 Party Packages

| Package | Price | Highlights |
|---------|-------|-----------|
| **Package 1** (Starter) | ₹375 + GST/person | 1 soup, 1 starter, 1 paneer, 1 sweet |
| **Package 2** (Classic) | ₹425 + GST/person | + Paratha, Dal Makhani, Biryani, Ice Cream |
| **Package 3** (Premium) ⭐ | ₹475 + GST/person | + 2 soups, 2 starters, 2 sweets, Baked Dish |
| **Package 4** (Royal) | ₹550 + GST/person | + 2 soups, 2 starters, Pasta, Full Ice Cream |

> Minimum 50 guests for all packages. Jain food options available on request.

---

## 📈 SEO

- Google Search Console verified
- Sitemap.xml & robots.txt configured
- JSON-LD structured data (LocalBusiness, Restaurant)
- Open Graph & Twitter Card meta tags
- 28+ localized keywords for Diu restaurant searches

---

## 📄 License

This project is proprietary. All rights reserved by Bawarchi - The Indian Cuisine Restaurant, Diu.

---

<p align="center">
  <strong>Bawarchi — The Indian Cuisine Restaurant</strong><br>
  Ground Floor, Near Mahalaxmi Temple, Vijay Chowk, Diu-362520<br>
  <a href="https://wa.me/917574033599">WhatsApp</a> · <a href="https://bawarchirestaurantdiu.com">Website</a>
</p>
