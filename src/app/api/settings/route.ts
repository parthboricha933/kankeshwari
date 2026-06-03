import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/admin-auth";

// GET /api/settings — Public: get all restaurant settings
export async function GET() {
  try {
    const settings = await db.restaurantSetting.findMany({
      orderBy: { label: "asc" },
    });
    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    console.error("[GET /api/settings] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings — Admin: update settings
export async function PUT(request: NextRequest) {
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
    const { settings } = body as { settings: { key: string; value: string; label?: string }[] };

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: "Settings array is required" }, { status: 400 });
    }

    const results = [];
    for (const s of settings) {
      const updated = await db.restaurantSetting.upsert({
        where: { key: s.key },
        update: { value: s.value, label: s.label || undefined },
        create: { key: s.key, value: s.value, label: s.label || s.key },
      });
      results.push(updated);
    }

    return NextResponse.json({ success: true, settings: results });
  } catch (error: unknown) {
    console.error("[PUT /api/settings] Error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
