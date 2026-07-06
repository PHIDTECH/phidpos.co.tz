import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where: { tenantId: (session?.user as any).tenantId },
        include: {
          supplier: { select: { name: true } },
          store: { select: { name: true } },
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.purchase.count({ where: { tenantId: (session?.user as any).tenantId } }),
    ]);

    return NextResponse.json({ purchases, total, page, limit });
  } catch {
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { storeId, supplierId, purchaseOrderId, invoiceNumber, items, amountPaid, note } = body;

    const total = items.reduce((sum: number, item: any) => sum + parseFloat(item.total), 0);
    const targetStoreId = storeId || (session?.user as any).storeId!;

    const purchase = await prisma.$transaction(async (tx) => {
      const newPurchase = await tx.purchase.create({
        data: {
          tenantId: (session?.user as any).tenantId!,
          storeId: targetStoreId,
          supplierId,
          purchaseOrderId: purchaseOrderId || null,
          invoiceNumber: invoiceNumber || null,
          total,
          amountPaid: parseFloat(amountPaid || 0),
          note: note || null,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: parseFloat(item.quantity),
              unitCost: parseFloat(item.unitCost),
              total: parseFloat(item.total),
            })),
          },
        },
        include: { items: true },
      });

      // Update inventory for each item
      for (const item of items) {
        const inventory = await tx.inventory.findUnique({
          where: { productId_storeId: { productId: item.productId, storeId: targetStoreId } },
        });
        const beforeQty = Number(inventory?.quantity || 0);
        const afterQty = beforeQty + parseFloat(item.quantity);

        await tx.inventory.upsert({
          where: { productId_storeId: { productId: item.productId, storeId: targetStoreId } },
          update: { quantity: afterQty },
          create: { productId: item.productId, storeId: targetStoreId, quantity: afterQty },
        });

        await tx.inventoryMovement.create({
          data: {
            tenantId: (session?.user as any).tenantId!,
            storeId: targetStoreId,
            productId: item.productId,
            type: "PURCHASE",
            quantity: parseFloat(item.quantity),
            beforeQty,
            afterQty,
            reference: invoiceNumber || newPurchase.id,
          },
        });

        // Update product cost price
        await tx.product.update({
          where: { id: item.productId },
          data: { costPrice: parseFloat(item.unitCost) },
        });
      }

      // Update supplier balance
      const balance = total - parseFloat(amountPaid || 0);
      if (balance > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { balance: { increment: balance } },
        });
      }

      return newPurchase;
    });

    return NextResponse.json({ purchase }, { status: 201 });
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}
