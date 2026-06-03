import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/admin-auth";

// GET /api/coupons — Admin: list all coupons
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const isValid = await verifyToken(token);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error: unknown) {
    console.error("[GET /api/coupons] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST /api/coupons — Admin: create a new coupon
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const isValid = await verifyToken(token);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const body = await request.json();
    const { code, discount, type, minOrder, maxUses, isActive, expiresAt } = body;

    if (!code || typeof discount !== "number" || discount <= 0) {
      return NextResponse.json(
        { error: "Code and a valid discount amount are required" },
        { status: 400 }
      );
    }

    const coupon = await db.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        discount,
        type: type || "FLAT",
        minOrder: minOrder || 0,
        maxUses: maxUses || 0,
        isActive: isActive !== false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/coupons] Error:", error);
    if (String(error).includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
