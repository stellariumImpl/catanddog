import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateToken } from "@/lib/sync-auth";

export async function GET(request: Request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "missing token" }, { status: 401 });
    }

    const user = await authenticateToken(token);
    if (!user) {
      return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }

    const [
      products,
      services,
      customers,
      suppliers,
      inventoryBatches,
      stockInRecords,
      orders,
      receipts,
      stockLedger,
      customerLedger,
      refunds,
      discountRules,
      coupons,
      storeSetting,
      deletions,
    ] = await Promise.all([
      prisma.product.findMany({ where: { userId: user.id } }),
      prisma.service.findMany({ where: { userId: user.id } }),
      prisma.customer.findMany({ where: { userId: user.id } }),
      prisma.supplier.findMany({ where: { userId: user.id } }),
      prisma.inventoryBatch.findMany({ where: { userId: user.id } }),
      prisma.stockInRecord.findMany({
        where: { userId: user.id },
        include: { items: true },
      }),
      prisma.order.findMany({ where: { userId: user.id }, include: { items: true } }),
      prisma.receipt.findMany({ where: { userId: user.id } }),
      prisma.stockLedger.findMany({ where: { userId: user.id } }),
      prisma.customerLedger.findMany({ where: { userId: user.id } }),
      prisma.refund.findMany({ where: { userId: user.id } }),
      prisma.discountRule.findMany({ where: { userId: user.id } }),
      prisma.coupon.findMany({ where: { userId: user.id } }),
      prisma.storeSetting.findFirst({ where: { userId: user.id } }),
      prisma.deletion.findMany({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      data: {
        products,
        services,
        customers,
        suppliers,
        inventoryBatches,
        stockInRecords,
        orders,
        receipts,
        stockLedger,
        customerLedger,
        refunds,
        discountRules,
        coupons,
        storeSettings: storeSetting || null,
        deletions,
      },
    });
  } catch (error) {
    console.error("sync pull error", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
