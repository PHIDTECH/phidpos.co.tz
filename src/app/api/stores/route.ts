import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stores = await prisma.store.findMany({
    where: { tenantId },
    select: { id: true, name: true, address: true, isMain: true, isActive: true },
    orderBy: { isMain: "desc" },
  });
  return NextResponse.json({ stores });
}
