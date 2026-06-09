import { NextResponse } from "next/server";
import { db, ensureDatabaseInitialized } from "@/lib/db";

// GET /api/coupons/available — Public: list active, non-expired coupons
export async function GET() {
  try {
    await ensureDatabaseInitialized();

    const now = new Date();

    const allActive = await db.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      select: {
        code: true,
        discount: true,
        type: true,
        minOrder: true,
        maxUses: true,
        usedCount: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter out coupons that have reached max usage
    const availableCoupons = allActive
      .filter((c) => !(c.maxUses > 0 && c.usedCount >= c.maxUses))
      .map(({ code, discount, type, minOrder }) => ({
        code,
        discount,
        type,
        minOrder,
      }));

    return NextResponse.json({ success: true, coupons: availableCoupons });
  } catch (error: unknown) {
    console.error("[GET /api/coupons/available] Error:", error);
    return NextResponse.json({ success: true, coupons: [] });
  }
}
