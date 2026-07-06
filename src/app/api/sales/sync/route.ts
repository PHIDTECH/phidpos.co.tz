import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateReceiptNumber } from "@/lib/utils";
import { OfflineSale } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { sales }: { sales: OfflineSale[] } = body;

    if (!sales || !Array.isArray(sales)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const results: { offlineId: string; status: "synced" | "duplicate" | "error"; saleId?: string }[] = [];

    for (const offlineSale of sales) {
      // Security: ensure tenant matches
      if (offlineSale.tenantId !== (session?.user as any).tenantId) {
        results.push({ offlineId: offlineSale.offlineId, status: "error" });
        continue;
      }

      // Check for duplicate
      const existing = await prisma.sale.findUnique({ where: { offlineId: offlineSale.offlineId } });
      if (existing) {
        results.push({ offlineId: offlineSale.offlineId, status: "duplicate", saleId: existing.id });
        continue;
      }

      try {
        const receiptNumber = offlineSale.receiptNumber || generateReceiptNumber();

        const sale = await prisma.$transaction(async (tx) => {
          const newSale = await tx.sale.create({
            data: {
              tenantId: offlineSale.tenantId,
              storeId: offlineSale.storeId,
              userId: offlineSale.userId,
              customerId: offlineSale.customerId || null,
              receiptNumber,
              subtotal: offlineSale.subtotal,
              discount: offlineSale.discount,
              tax: offlineSale.tax,
              total: offlineSale.total,
              amountPaid: offlineSale.amountPaid,
              change: offlineSale.change,
              debtAmount: offlineSale.debtAmount,
              paymentMethod: offlineSale.paymentMethod,
              isOfflineSync: true,
              offlineId: offlineSale.offlineId,
              createdAt: new Date(offlineSale.createdAt),
              items: {
                create: offlineSale.items.map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId || null,
                  name: item.name,
                  barcode: item.barcode || null,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discount: item.discount,
                  total: item.total,
                })),
              },
            },
          });

          // Update inventory
          for (const item of offlineSale.items) {
            const inventory = await tx.inventory.findUnique({
              where: { productId_storeId: { productId: item.productId, storeId: offlineSale.storeId } },
            });
            const beforeQty = Number(inventory?.quantity || 0);
            const afterQty = beforeQty - item.quantity;

            await tx.inventory.upsert({
              where: { productId_storeId: { productId: item.productId, storeId: offlineSale.storeId } },
              update: { quantity: afterQty },
              create: { productId: item.productId, storeId: offlineSale.storeId, quantity: afterQty },
            });

            await tx.inventoryMovement.create({
              data: {
                tenantId: offlineSale.tenantId,
                storeId: offlineSale.storeId,
                productId: item.productId,
                type: "SALE",
                quantity: item.quantity,
                beforeQty,
                afterQty,
                reference: receiptNumber,
                note: "Offline sale sync",
              },
            });
          }

          // Update customer debt
          if (offlineSale.customerId && offlineSale.debtAmount > 0) {
            await tx.customer.update({
              where: { id: offlineSale.customerId },
              data: { totalDebt: { increment: offlineSale.debtAmount } },
            });
          }

          return newSale;
        });

        results.push({ offlineId: offlineSale.offlineId, status: "synced", saleId: sale.id });
      } catch (err) {
        console.error(`Failed to sync sale ${offlineSale.offlineId}:`, err);
        results.push({ offlineId: offlineSale.offlineId, status: "error" });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
