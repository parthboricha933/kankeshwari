import { NextRequest, NextResponse } from "next/server";
import { db, ensureDatabaseInitialized } from "@/lib/db";

// Get UPI configuration with safe fallbacks
function getUpiConfig() {
  const upiId = process.env.UPI_ID || "ruchitpatel.8866-5@oksbi";
  const upiPayeeName = process.env.UPI_PAYEE_NAME || "Bawarchi";
  return { upiId, upiPayeeName };
}

// Generate a short human-readable order ID
function generateOrderId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `BWR-${dateStr}-${timeStr}-${rand}`;
}

// Default settings fallback (used if DB query fails)
const DEFAULT_CHARGES = {
  packagingCharge: 20,
  deliveryCharge: 30,
  gstPercent: 5,
};

// POST /api/orders — Create a new order and return UPI payment link
export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();

    const body = await request.json();
    const { items, customerName, customerPhone, notes, couponCode } = body;

    // ── Validation ─────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.name || typeof item.price !== "number" || item.price < 0) {
        return NextResponse.json(
          { error: "Each item must have a name and a valid price" },
          { status: 400 }
        );
      }
      if (typeof item.quantity !== "number" || item.quantity < 1) {
        return NextResponse.json(
          { error: "Each item must have a quantity of at least 1" },
          { status: 400 }
        );
      }
    }

    // ── Fetch settings from DB with fallback ──────────────────
    let packagingCharge = DEFAULT_CHARGES.packagingCharge;
    let deliveryCharge = DEFAULT_CHARGES.deliveryCharge;
    let gstPercent = DEFAULT_CHARGES.gstPercent;

    try {
      const settings = await db.restaurantSetting.findMany();
      const settingsMap: Record<string, string> = {};
      for (const s of settings) {
        settingsMap[s.key] = s.value;
      }
      packagingCharge = parseInt(settingsMap.packaging_charge || "0") || DEFAULT_CHARGES.packagingCharge;
      deliveryCharge = parseInt(settingsMap.delivery_charge || "0") || DEFAULT_CHARGES.deliveryCharge;
      gstPercent = parseFloat(settingsMap.gst_percent || "5") || DEFAULT_CHARGES.gstPercent;
    } catch (settingsError) {
      console.error("[POST /api/orders] Settings fetch failed, using defaults:", settingsError);
    }

    // ── Calculate subtotal ─────────────────────────────────
    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );

    // ── Validate and apply coupon ──────────────────────────
    let discount = 0;
    let appliedCouponCode: string | null = null;

    if (couponCode) {
      try {
        const coupon = await db.coupon.findUnique({
          where: { code: couponCode.toUpperCase().trim() },
        });

        if (coupon && coupon.isActive) {
          const isExpired = coupon.expiresAt && coupon.expiresAt < new Date();
          const isMaxedOut = coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses;
          const meetsMinOrder = !coupon.minOrder || subtotal >= coupon.minOrder;

          if (!isExpired && !isMaxedOut && meetsMinOrder) {
            if (coupon.type === "PERCENT") {
              discount = Math.round(subtotal * coupon.discount / 100);
            } else {
              discount = coupon.discount;
            }
            // Discount cannot exceed subtotal
            if (discount > subtotal) discount = subtotal;
            appliedCouponCode = coupon.code;
          }
        }
      } catch (couponError) {
        console.error("[POST /api/orders] Coupon validation failed:", couponError);
      }
    }

    // ── Calculate totals ───────────────────────────────────
    const afterDiscount = subtotal - discount;
    const gst = Math.round(afterDiscount * gstPercent / 100);
    const grandTotal = afterDiscount + gst + packagingCharge + deliveryCharge;

    if (grandTotal <= 0) {
      return NextResponse.json(
        { error: "Order total must be greater than zero" },
        { status: 400 }
      );
    }

    // ── Create order in database ───────────────────────────
    const orderId = generateOrderId();

    const order = await db.order.create({
      data: {
        orderId,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        subtotal,
        gst,
        packagingCharge,
        deliveryCharge,
        discount,
        couponCode: appliedCouponCode,
        grandTotal,
        notes: notes || null,
        status: "PENDING",
        paymentMethod: "UPI",
        items: {
          create: items.map(
            (item: { name: string; price: number; quantity: number }) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity,
            })
          ),
        },
      },
      include: { items: true },
    });

    // ── Increment coupon usage if applied ──────────────────
    if (appliedCouponCode) {
      try {
        await db.coupon.update({
          where: { code: appliedCouponCode },
          data: { usedCount: { increment: 1 } },
        });
      } catch (couponUpdateError) {
        console.error("[POST /api/orders] Coupon usage increment failed:", couponUpdateError);
      }
    }

    // ── Generate UPI payment link ──────────────────────────
    const { upiId, upiPayeeName } = getUpiConfig();
    const upiAmount = grandTotal.toFixed(2);
    const transactionNote = `Bawarchi Order ${orderId}`;

    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiPayeeName)}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          orderId: order.orderId,
          subtotal: order.subtotal,
          gst: order.gst,
          packagingCharge: order.packagingCharge,
          deliveryCharge: order.deliveryCharge,
          discount: order.discount,
          couponCode: order.couponCode,
          grandTotal: order.grandTotal,
          status: order.status,
          items: order.items,
          createdAt: order.createdAt,
        },
        payment: {
          upiLink,
          upiId,
          payeeName: upiPayeeName,
          amount: upiAmount,
          currency: "INR",
          transactionNote,
        },
        charges: {
          packagingCharge,
          deliveryCharge,
          gstPercent,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/orders] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/orders — List recent orders (admin only)
export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();

    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const adminToken = await db.adminToken.findUnique({
      where: { token },
      include: { admin: true },
    });

    if (!adminToken || adminToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const status = url.searchParams.get("status");

    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({ success: true, orders, total, limit, offset });
  } catch (error: unknown) {
    console.error("[GET /api/orders] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
