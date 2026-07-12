import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const purchases = await (prisma as any).smsPurchase.findMany({
      include: { tenant: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ purchases });
  } catch {
    return NextResponse.json({ purchases: [] });
  }
}
