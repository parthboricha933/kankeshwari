import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST /api/orders/[id]/confirm — Confirm payment for an order (customer self-confirms or admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { upiTransactionRef, customerName, customerPhone } = body;

    const order = await prisma.order.findUnique({
      where: { orderId: id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Prevent duplicate confirmation
    if (order.status === "CONFIRMED" || order.status === "COMPLETED") {
      return NextResponse.json(
        {
          error: "Order has already been confirmed",
          order: {
            orderId: order.orderId,
            status: order.status,
          },
        },
        { status: 409 }
      );
    }

    // Update order status to CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { orderId: id },
      data: {
        status: "CONFIRMED",
        upiTransactionRef: upiTransactionRef || null,
        customerName: customerName || order.customerName,
        customerPhone: customerPhone || order.customerPhone,
      },
      include: { items: true },
    });

    return NextResponse.json({
      success: true,
      message: "Payment confirmed. Order is being processed.",
      order: {
        orderId: updatedOrder.orderId,
        status: updatedOrder.status,
        grandTotal: updatedOrder.grandTotal,
        items: updatedOrder.items,
        customerName: updatedOrder.customerName,
        customerPhone: updatedOrder.customerPhone,
        upiTransactionRef: updatedOrder.upiTransactionRef,
        confirmedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error: unknown) {
    console.error("[POST /api/orders/[id]/confirm] Error:", error);
    return NextResponse.json(
      { error: "Failed to confirm order" },
      { status: 500 }
    );
  }
}
