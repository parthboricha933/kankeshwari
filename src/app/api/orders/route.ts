import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Validate required environment variables at startup
function getUpiConfig() {
  const upiId = process.env.UPI_ID;
  const upiPayeeName = process.env.UPI_PAYEE_NAME || "Bawarchi";
  if (!upiId) {
    throw new Error("UPI_ID environment variable is not set");
  }
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

// POST /api/orders — Create a new order and return UPI payment link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerName, customerPhone, notes } = body;

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

    // ── Calculate totals ───────────────────────────────────
    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const gst = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + gst;

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

    // ── Generate UPI payment link ──────────────────────────
    const { upiId, upiPayeeName } = getUpiConfig();
    const upiAmount = (grandTotal / 100).toFixed(2); // Convert paise to rupees if stored in paise; currently stored as rupees
    const transactionNote = `Bawarchi Order ${orderId}`;

    // UPI deep link format
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiPayeeName)}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          orderId: order.orderId,
          subtotal: order.subtotal,
          gst: order.gst,
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
