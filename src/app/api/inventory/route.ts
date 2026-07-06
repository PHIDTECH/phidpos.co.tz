import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId") || (session?.user as any).storeId;
    const lowStock = searchParams.get("lowStock") === "true";

    const inventories = await prisma.inventory.findMany({
      where: {
        storeId: storeId || undefined,
        store: { tenantId: (session?.user as any).tenantId },
        ...(lowStock && {
          quantity: { lte: prisma.inventory.fields.quantity },
        }),
      },
      include: {
        product: {
          include: { category: true, unit: true },
        },
        store: { select: { name: true } },
      },
    });

    // Filter low stock manually
    const result = lowStock
      ? inventories.filter((i) => Number(i.quantity) <= i.product.minStockLevel)
      : inventories;

    return NextResponse.json({ inventories: result });
  } catch {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { productId, storeId, quantity, type, note } = body;
    const targetStoreId = storeId || (session?.user as any).storeId!;
    const adjustQty = parseFloat(quantity);

    const result = await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { productId_storeId: { productId, storeId: targetStoreId } },
      });

      const beforeQty = Number(inventory?.quantity || 0);
      let afterQty: number;

      if (type === "ADJUSTMENT") {
        afterQty = adjustQty;
      } else if (type === "STOCK_IN") {
        afterQty = beforeQty + adjustQty;
      } else if (type === "STOCK_OUT") {
        afterQty = beforeQty - adjustQty;
      } else {
        afterQty = adjustQty;
      }

      const updated = await tx.inventory.upsert({
        where: { productId_storeId: { productId, storeId: targetStoreId } },
        update: { quantity: afterQty },
        create: { productId, storeId: targetStoreId, quantity: afterQty },
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId: (session?.user as any).tenantId!,
          storeId: targetStoreId,
          productId,
          type,
          quantity: Math.abs(adjustQty),
          beforeQty,
          afterQty,
          note: note || null,
        },
      });

      return updated;
    });

    return NextResponse.json({ inventory: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
