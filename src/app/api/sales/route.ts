import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateReceiptNumber } from "@/lib/utils";
import { sendSMS, buildSaleNotification } from "@/lib/sms";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId") || (session?.user as any).storeId;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: (session?.user as any).tenantId,
      ...(storeId && { storeId }),
      ...(from || to ? {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to + "T23:59:59") }),
        },
      } : {}),
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          user: { select: { name: true } },
          customer: { select: { name: true, phone: true } },
          store: { select: { name: true } },
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({ sales, total, page, limit });
  } catch {
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId as string | undefined;
    const sessionStoreId = (session?.user as any)?.storeId as string | undefined;
    const userId = session?.user?.id as string | undefined;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      storeId,
      customerId,
      items,
      subtotal,
      discount,
      tax,
      total,
      amountPaid,
      change,
      debtAmount,
      paymentMethod,
      note,
      offlineId,
      createdAt,
    } = body;

    // Prevent duplicate offline sync
    if (offlineId) {
      const existing = await prisma.sale.findUnique({ where: { offlineId } });
      if (existing) return NextResponse.json({ sale: existing, duplicate: true });
    }

    const receiptNumber = generateReceiptNumber();

    const sale = await prisma.$transaction(async (tx) => {
      // Create the sale
      const newSale = await tx.sale.create({
        data: {
          tenantId,
          storeId: storeId || sessionStoreId!,
          userId: userId!,
          customerId: customerId || null,
          receiptNumber,
          subtotal: parseFloat(subtotal),
          discount: parseFloat(discount || 0),
          tax: parseFloat(tax || 0),
          total: parseFloat(total),
          amountPaid: parseFloat(amountPaid),
          change: parseFloat(change || 0),
          debtAmount: parseFloat(debtAmount || 0),
          paymentMethod,
          note: note || null,
          isOfflineSync: !!offlineId,
          offlineId: offlineId || null,
          createdAt: createdAt ? new Date(createdAt) : undefined,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId || null,
              name: item.name,
              barcode: item.barcode || null,
              quantity: parseFloat(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
              discount: parseFloat(item.discount || 0),
              total: parseFloat(item.total),
            })),
          },
        },
        include: { items: true },
      });

      // Update inventory
      for (const item of items) {
        const targetStoreId = storeId || (session?.user as any).storeId!;
        const inventory = await tx.inventory.findUnique({
          where: { productId_storeId: { productId: item.productId, storeId: targetStoreId } },
        });
        const beforeQty = inventory?.quantity || 0;
        const afterQty = Number(beforeQty) - parseFloat(item.quantity);

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
            type: "SALE",
            quantity: parseFloat(item.quantity),
            beforeQty: Number(beforeQty),
            afterQty,
            reference: receiptNumber,
          },
        });
      }

      // Update customer debt & loyalty
      if (customerId) {
        if (debtAmount > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: { totalDebt: { increment: parseFloat(debtAmount) } },
          });
        }

        const loyaltySettings = await tx.loyaltySettings.findUnique({
          where: { tenantId: (session?.user as any).tenantId! },
        });

        if (loyaltySettings?.isActive) {
          const points = Math.floor(parseFloat(total) / Number(loyaltySettings.amountPerPoint)) * loyaltySettings.pointsPerAmount;
          if (points > 0) {
            await tx.customer.update({
              where: { id: customerId },
              data: { loyaltyPoints: { increment: points } },
            });
          }
        }
      }

      // Create accounting entry
      const accounts = await tx.account.findMany({
        where: { tenantId: (session?.user as any).tenantId!, code: { in: ["1000", "4000", "5000", "1200", "1100"] } },
      });

      const cashAccount = accounts.find((a) => a.code === "1000");
      const revenueAccount = accounts.find((a) => a.code === "4000");
      const receivableAccount = accounts.find((a) => a.code === "1100");

      if (cashAccount && revenueAccount) {
        const journalEntry = await tx.journalEntry.create({
          data: {
            tenantId: (session?.user as any).tenantId!,
            saleId: newSale.id,
            description: `Sale - ${receiptNumber}`,
            reference: receiptNumber,
            lines: {
              create: [
                {
                  debitAccountId: parseFloat(debtAmount) > 0 && receivableAccount ? receivableAccount.id : cashAccount.id,
                  creditAccountId: revenueAccount.id,
                  amount: parseFloat(total),
                  description: `Sale revenue - ${receiptNumber}`,
                },
              ],
            },
          },
        });
      }

      return newSale;
    });

    // Send SMS notifications (non-blocking)
    const tenant = await prisma.tenant.findUnique({ where: { id: (session?.user as any).tenantId } });
    if (tenant?.smsApiKey) {
      const adminUsers = await prisma.user.findMany({
        where: { tenantId: (session?.user as any).tenantId, role: { in: ["TENANT_ADMIN", "STORE_MANAGER"] } },
        take: 1,
      });

      if (adminUsers[0]?.phone) {
        sendSMS({
          to: adminUsers[0].phone,
          message: buildSaleNotification({
            shopName: tenant.name,
            cashierName: session?.user?.name || "Cashier",
            receiptNumber,
            total: parseFloat(total),
            currency: tenant.currency,
          }),
          apiKey: tenant.smsApiKey || undefined,
          senderId: tenant.smsSenderId || undefined,
        }).catch(console.error);
      }
    }

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    console.error("Sale error:", error);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
