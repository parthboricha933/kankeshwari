import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabaseInitialized } from "@/lib/db";
import { verifyToken } from "@/lib/admin-auth";

// Default settings to seed if table is empty
const DEFAULT_SETTINGS = [
  { key: "packaging_charge", value: "20", label: "Packaging Charge" },
  { key: "delivery_charge", value: "30", label: "Delivery Charge" },
  { key: "gst_percent", value: "5", label: "GST Percentage" },
  { key: "upi_id", value: "ruchitpatel.8866-5@oksbi", label: "UPI ID" },
];

// GET /api/settings — Public: get all restaurant settings (auto-seeds defaults if empty)
export async function GET() {
  try {
    await ensureDatabaseInitialized();

    let settings = await db.restaurantSetting.findMany({
      orderBy: { label: "asc" },
    });

    // Auto-seed default settings if table is empty
    if (settings.length === 0) {
      for (const s of DEFAULT_SETTINGS) {
        await db.restaurantSetting.upsert({
          where: { key: s.key },
          update: { value: s.value, label: s.label },
          create: { key: s.key, value: s.value, label: s.label },
        });
      }
      settings = await db.restaurantSetting.findMany({
        orderBy: { label: "asc" },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    console.error("[GET /api/settings] Error:", error);
    // Return hardcoded defaults as fallback so the site still works
    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS.map(s => ({ ...s, id: "fallback", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })),
    });
  }
}

// PUT /api/settings — Admin: update settings
export async function PUT(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();

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

    const results: { id: string; key: string; value: string; label: string; createdAt: Date; updatedAt: Date }[] = [];
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
