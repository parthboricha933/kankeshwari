import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/coupons/validate — Public: validate a coupon code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: "Invalid coupon code" },
        { status: 200 }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { valid: false, error: "This coupon is no longer active" },
        { status: 200 }
      );
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, error: "This coupon has expired" },
        { status: 200 }
      );
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { valid: false, error: "This coupon has reached its usage limit" },
        { status: 200 }
      );
    }

    if (coupon.minOrder > 0 && (subtotal || 0) < coupon.minOrder) {
      return NextResponse.json(
        { valid: false, error: `Minimum order of ₹${coupon.minOrder} required for this coupon` },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount: coupon.discount,
        type: coupon.type,
        minOrder: coupon.minOrder,
      },
    });
  } catch (error: unknown) {
    console.error("[POST /api/coupons/validate] Error:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
