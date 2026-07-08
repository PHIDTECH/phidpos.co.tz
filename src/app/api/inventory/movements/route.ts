import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = (session.user as any).tenantId;
  if (!tenantId) return NextResponse.json({ movements: [] });

  const movements = await prisma.inventoryMovement.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      product: { select: { name: true } },
    },
  });

  const result = movements.map(m => ({
    id: m.id,
    type: m.type,
    quantityBefore: Number(m.beforeQty),
    quantityAfter: Number(m.afterQty),
    change: Number(m.afterQty) - Number(m.beforeQty),
    note: m.note,
    reference: m.reference,
    createdAt: m.createdAt.toISOString(),
    product: m.product,
  }));

  return NextResponse.json({ movements: result });
}
