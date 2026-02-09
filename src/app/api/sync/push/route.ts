import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateToken } from "@/lib/sync-auth";

const toDate = (value?: string | Date) => {
  if (!value) return new Date();
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const getUpdatedAt = (record: any) =>
  toDate(record.updatedAt || record.createdAt || record.date || record.receivedAt);

const normalizeDeletionInput = (input?: Record<string, string[]>) => {
  if (!input) return [] as { collection: string; recordId: string }[];
  return Object.entries(input).flatMap(([collection, ids]) =>
    (ids || []).map((recordId) => ({ collection, recordId }))
  );
};

export async function POST(request: Request) {
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

    const body = await request.json();
    const data = body?.data || {};
    const incomingDeletions = normalizeDeletionInput(
      body?.deletions || data?.deletions
    );

    const existingDeletions = await prisma.deletion.findMany({
      where: { userId: user.id },
    });
    const deletedSet = new Set(
      existingDeletions.map((item) => `${item.collection}:${item.recordId}`)
    );

    if (incomingDeletions.length > 0) {
      await prisma.$transaction(
        incomingDeletions.map((item) =>
          prisma.deletion.upsert({
            where: { id: `DEL-${item.collection}-${item.recordId}` },
            update: { deletedAt: new Date() },
            create: {
              id: `DEL-${item.collection}-${item.recordId}`,
              userId: user.id,
              collection: item.collection,
              recordId: item.recordId,
              deletedAt: new Date(),
            },
          })
        )
      );

      incomingDeletions.forEach((item) => {
        deletedSet.add(`${item.collection}:${item.recordId}`);
      });
    }

    const isDeleted = (collection: string, id: string) =>
      deletedSet.has(`${collection}:${id}`);

    const products = data.products || [];
    for (const product of products) {
      if (!product?.id || isDeleted("products", product.id)) continue;
      const updatedAt = getUpdatedAt(product);
      const existing = await prisma.product.findUnique({
        where: { id: product.id },
      });
      if (existing && existing.updatedAt >= updatedAt) continue;
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          barcode: product.barcode || null,
          price: product.price,
          cost: product.cost ?? null,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold ?? null,
          updatedAt,
        },
        create: {
          id: product.id,
          userId: user.id,
          name: product.name,
          barcode: product.barcode || null,
          price: product.price,
          cost: product.cost ?? null,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold ?? null,
          createdAt: toDate(product.createdAt),
          updatedAt,
        },
      });
    }

    const services = data.services || [];
    for (const service of services) {
      if (!service?.id || isDeleted("services", service.id)) continue;
      const updatedAt = getUpdatedAt(service);
      const existing = await prisma.service.findUnique({
        where: { id: service.id },
      });
      if (existing && existing.updatedAt >= updatedAt) continue;
      await prisma.service.upsert({
        where: { id: service.id },
        update: {
          name: service.name,
          price: service.price,
          durationMinutes: service.durationMinutes ?? null,
          note: service.note ?? null,
          updatedAt,
        },
        create: {
          id: service.id,
          userId: user.id,
          name: service.name,
          price: service.price,
          durationMinutes: service.durationMinutes ?? null,
          note: service.note ?? null,
          createdAt: toDate(service.createdAt),
          updatedAt,
        },
      });
    }

    const customers = data.customers || [];
    for (const customer of customers) {
      if (!customer?.id || isDeleted("customers", customer.id)) continue;
      const updatedAt = getUpdatedAt(customer);
      const existing = await prisma.customer.findUnique({
        where: { id: customer.id },
      });
      if (existing && existing.updatedAt >= updatedAt) continue;
      await prisma.customer.upsert({
        where: { id: customer.id },
        update: {
          name: customer.name ?? null,
          phone: customer.phone ?? null,
          balance: customer.balance ?? 0,
          updatedAt,
        },
        create: {
          id: customer.id,
          userId: user.id,
          name: customer.name ?? null,
          phone: customer.phone ?? null,
          balance: customer.balance ?? 0,
          createdAt: toDate(customer.createdAt),
          updatedAt,
        },
      });
    }

    const discountRules = data.discountRules || [];
    for (const rule of discountRules) {
      if (!rule?.id || isDeleted("discountRules", rule.id)) continue;
      const updatedAt = getUpdatedAt(rule);
      const existing = await prisma.discountRule.findUnique({
        where: { id: rule.id },
      });
      if (existing && existing.updatedAt >= updatedAt) continue;
      await prisma.discountRule.upsert({
        where: { id: rule.id },
        update: {
          name: rule.name,
          scope: rule.scope || "all",
          threshold: rule.threshold,
          amount: rule.amount,
          startAt: rule.startAt ? toDate(rule.startAt) : null,
          endAt: rule.endAt ? toDate(rule.endAt) : null,
          enabled: rule.enabled,
          updatedAt,
        },
        create: {
          id: rule.id,
          userId: user.id,
          name: rule.name,
          scope: rule.scope || "all",
          threshold: rule.threshold,
          amount: rule.amount,
          startAt: rule.startAt ? toDate(rule.startAt) : null,
          endAt: rule.endAt ? toDate(rule.endAt) : null,
          enabled: rule.enabled,
          createdAt: toDate(rule.createdAt),
          updatedAt,
        },
      });
    }

    const coupons = data.coupons || [];
    for (const coupon of coupons) {
      if (!coupon?.id || isDeleted("coupons", coupon.id)) continue;
      const updatedAt = getUpdatedAt(coupon);
      const existing = await prisma.coupon.findUnique({
        where: { id: coupon.id },
      });
      if (existing && existing.updatedAt >= updatedAt) continue;
      await prisma.coupon.upsert({
        where: { id: coupon.id },
        update: {
          name: coupon.name,
          code: coupon.code ?? null,
          scope: coupon.scope || "all",
          threshold: coupon.threshold ?? null,
          amount: coupon.amount,
          startAt: coupon.startAt ? toDate(coupon.startAt) : null,
          endAt: coupon.endAt ? toDate(coupon.endAt) : null,
          enabled: coupon.enabled,
          usageLimit: coupon.usageLimit ?? null,
          updatedAt,
        },
        create: {
          id: coupon.id,
          userId: user.id,
          name: coupon.name,
          code: coupon.code ?? null,
          scope: coupon.scope || "all",
          threshold: coupon.threshold ?? null,
          amount: coupon.amount,
          startAt: coupon.startAt ? toDate(coupon.startAt) : null,
          endAt: coupon.endAt ? toDate(coupon.endAt) : null,
          enabled: coupon.enabled,
          usageLimit: coupon.usageLimit ?? null,
          createdAt: toDate(coupon.createdAt),
          updatedAt,
        },
      });
    }

    if (data.storeSettings) {
      const settings = data.storeSettings;
      const updatedAt = getUpdatedAt(settings);
      const existing = await prisma.storeSetting.findFirst({
        where: { userId: user.id },
      });
      const paymentMethods =
        Array.isArray(settings.paymentMethods) && settings.paymentMethods.length > 0
          ? settings.paymentMethods
          : ["余额", "现金", "微信", "支付宝", "银行卡"];
      if (!existing || existing.updatedAt < updatedAt) {
        await prisma.storeSetting.upsert({
          where: { userId: user.id },
          update: {
            memberDiscountRate:
              typeof settings.memberDiscountRate === "number"
                ? settings.memberDiscountRate
                : 1,
            paymentMethods,
            updatedAt,
          },
          create: {
            id: `SETTINGS-${user.id}`,
            userId: user.id,
            memberDiscountRate:
              typeof settings.memberDiscountRate === "number"
                ? settings.memberDiscountRate
                : 1,
            paymentMethods,
            createdAt: toDate(settings.createdAt),
            updatedAt,
          },
        });
      }
    }

    const suppliers = data.suppliers || [];
    for (const supplier of suppliers) {
      if (!supplier?.id || isDeleted("suppliers", supplier.id)) continue;
      const updatedAt = getUpdatedAt(supplier);
      const existing = await prisma.supplier.findUnique({
        where: { id: supplier.id },
      });
      if (existing && existing.updatedAt >= updatedAt) continue;
      await prisma.supplier.upsert({
        where: { id: supplier.id },
        update: {
          name: supplier.name,
          contact: supplier.contact ?? null,
          phone: supplier.phone ?? null,
          note: supplier.note ?? null,
          updatedAt,
        },
        create: {
          id: supplier.id,
          userId: user.id,
          name: supplier.name,
          contact: supplier.contact ?? null,
          phone: supplier.phone ?? null,
          note: supplier.note ?? null,
          createdAt: toDate(supplier.createdAt),
          updatedAt,
        },
      });
    }

    const inventoryBatches = data.inventoryBatches || [];
    for (const batch of inventoryBatches) {
      if (!batch?.id) continue;
      const existing = await prisma.inventoryBatch.findUnique({
        where: { id: batch.id },
      });
      if (existing) continue;
      await prisma.inventoryBatch.create({
        data: {
          id: batch.id,
          userId: user.id,
          productId: batch.productId,
          supplierId: batch.supplierId ?? null,
          batchNo: batch.batchNo ?? null,
          quantity: batch.quantity,
          cost: batch.cost ?? null,
          expiresAt: batch.expiresAt ? toDate(batch.expiresAt) : null,
          receivedAt: toDate(batch.receivedAt),
          stockInId: batch.stockInId ?? null,
        },
      });
    }

    const stockInRecords = data.stockInRecords || [];
    for (const record of stockInRecords) {
      if (!record?.id) continue;
      const updatedAt = getUpdatedAt(record);
      const existing = await prisma.stockInRecord.findUnique({
        where: { id: record.id },
        include: { items: true },
      });
      if (existing && existing.updatedAt >= updatedAt) continue;

      const items = (record.items || []).map((item: any, index: number) => ({
        id: item.id || `SIITEM-${record.id}-${index}`,
        productId: item.productId,
        quantity: item.quantity,
        cost: item.cost ?? null,
      }));

      await prisma.stockInRecord.upsert({
        where: { id: record.id },
        update: {
          date: toDate(record.date),
          note: record.note ?? null,
          supplierId: record.supplierId ?? null,
          batchNo: record.batchNo ?? null,
          expiresAt: record.expiresAt ? toDate(record.expiresAt) : null,
          status: record.status,
          totalQuantity: record.totalQuantity,
          totalCost: record.totalCost ?? null,
          updatedAt,
          items: {
            deleteMany: {},
            createMany: {
              data: items,
            },
          },
        },
        create: {
          id: record.id,
          userId: user.id,
          date: toDate(record.date),
          note: record.note ?? null,
          supplierId: record.supplierId ?? null,
          batchNo: record.batchNo ?? null,
          expiresAt: record.expiresAt ? toDate(record.expiresAt) : null,
          status: record.status,
          totalQuantity: record.totalQuantity,
          totalCost: record.totalCost ?? null,
          createdAt: toDate(record.createdAt),
          updatedAt,
          items: {
            createMany: {
              data: items,
            },
          },
        },
      });
    }

    const orders = data.orders || [];
    for (const order of orders) {
      if (!order?.id) continue;
      const updatedAt = getUpdatedAt(order);
      const normalizedOrderNo =
        order.orderNo ||
        `SO${new Date(order.date || Date.now()).getFullYear()}${String(
          new Date(order.date || Date.now()).getMonth() + 1
        ).padStart(2, "0")}${String(
          new Date(order.date || Date.now()).getDate()
        ).padStart(2, "0")}${String(
          new Date(order.date || Date.now()).getHours()
        ).padStart(2, "0")}${String(
          new Date(order.date || Date.now()).getMinutes()
        ).padStart(2, "0")}${String(order.id).slice(-6).toUpperCase()}`;
      const discountAmount = typeof order.discountAmount === "number" ? order.discountAmount : 0;
      const payableTotal =
        typeof order.payableTotal === "number"
          ? order.payableTotal
          : Math.max(0, order.total - discountAmount);
      const existing = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
      if (existing && existing.updatedAt >= updatedAt) continue;

      const items = (order.items || []).map((item: any, index: number) => ({
        id: item.id || `OI-${order.id}-${index}`,
        type: item.type,
        productId: item.productId ?? null,
        serviceId: item.serviceId ?? null,
        name: item.name ?? null,
        quantity: item.quantity,
        price: item.price,
      }));

      await prisma.order.upsert({
        where: { id: order.id },
        update: {
          orderNo: normalizedOrderNo,
          customerId: order.customerId ?? null,
          date: toDate(order.date),
          total: order.total,
          paymentMethod: order.paymentMethod ?? null,
          paymentAmount: order.paymentAmount ?? null,
          discountAmount,
          discountType: order.discountType ?? null,
          discountName: order.discountName ?? null,
          discountRuleId: order.discountRuleId ?? null,
          discountRate: order.discountRate ?? null,
          payableTotal,
          paymentStatus: order.paymentStatus,
          status: order.status,
          updatedAt,
          items: {
            deleteMany: {},
            createMany: {
              data: items,
            },
          },
        },
        create: {
          id: order.id,
          orderNo: normalizedOrderNo,
          userId: user.id,
          customerId: order.customerId ?? null,
          date: toDate(order.date),
          total: order.total,
          paymentMethod: order.paymentMethod ?? null,
          paymentAmount: order.paymentAmount ?? null,
          discountAmount,
          discountType: order.discountType ?? null,
          discountName: order.discountName ?? null,
          discountRuleId: order.discountRuleId ?? null,
          discountRate: order.discountRate ?? null,
          payableTotal,
          paymentStatus: order.paymentStatus,
          status: order.status,
          createdAt: toDate(order.createdAt),
          updatedAt,
          items: {
            createMany: {
              data: items,
            },
          },
        },
      });
    }

    // Recalculate coupon usage counts from confirmed orders (server-authoritative)
    const couponIds = await prisma.coupon.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    for (const coupon of couponIds) {
      const usedCount = await prisma.order.count({
        where: {
          userId: user.id,
          discountType: "coupon",
          discountRuleId: coupon.id,
          status: "confirmed",
        },
      });
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount, updatedAt: new Date() },
      });
    }

    const receipts = data.receipts || [];
    for (const receipt of receipts) {
      if (!receipt?.id) continue;
      const existing = await prisma.receipt.findUnique({
        where: { id: receipt.id },
      });
      if (existing) continue;
      await prisma.receipt.create({
        data: {
          id: receipt.id,
          userId: user.id,
          orderId: receipt.orderId,
          createdAt: toDate(receipt.createdAt),
        },
      });
    }

    const stockLedger = data.stockLedger || [];
    for (const entry of stockLedger) {
      if (!entry?.id) continue;
      const existing = await prisma.stockLedger.findUnique({
        where: { id: entry.id },
      });
      if (existing) continue;
      await prisma.stockLedger.create({
        data: {
          id: entry.id,
          userId: user.id,
          productId: entry.productId,
          type: entry.type,
          quantity: entry.quantity,
          date: toDate(entry.date),
          relatedId: entry.relatedId ?? null,
          note: entry.note ?? null,
        },
      });
    }

    const customerLedger = data.customerLedger || [];
    for (const entry of customerLedger) {
      if (!entry?.id) continue;
      const existing = await prisma.customerLedger.findUnique({
        where: { id: entry.id },
      });
      if (existing) continue;
      await prisma.customerLedger.create({
        data: {
          id: entry.id,
          userId: user.id,
          customerId: entry.customerId,
          type: entry.type,
          amount: entry.amount,
          balanceAfter: entry.balanceAfter,
          note: entry.note ?? null,
          relatedId: entry.relatedId ?? null,
          createdAt: toDate(entry.createdAt),
        },
      });
    }

    const refunds = data.refunds || [];
    for (const refund of refunds) {
      if (!refund?.id) continue;
      const existing = await prisma.refund.findUnique({
        where: { id: refund.id },
      });
      if (existing) continue;
      await prisma.refund.create({
        data: {
          id: refund.id,
          userId: user.id,
          orderId: refund.orderId,
          amount: refund.amount,
          reason: refund.reason ?? null,
          createdAt: toDate(refund.createdAt),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("sync push error", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
