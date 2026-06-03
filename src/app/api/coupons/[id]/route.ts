import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/admin-auth";

// PUT /api/coupons/[id] — Admin: update a coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const coupon = await db.coupon.update({
      where: { id },
      data: {
        code: body.code ? body.code.toUpperCase().trim() : undefined,
        discount: body.discount !== undefined ? body.discount : undefined,
        type: body.type || undefined,
        minOrder: body.minOrder !== undefined ? body.minOrder : undefined,
        maxUses: body.maxUses !== undefined ? body.maxUses : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : undefined,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: unknown) {
    console.error("[PUT /api/coupons/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

// DELETE /api/coupons/[id] — Admin: delete a coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const isValid = await verifyToken(token);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    await db.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[DELETE /api/coupons/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
