import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalTenants, activeTenants, totalUsers, todaySalesAgg, tenants] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: { in: ["ACTIVE", "TRIAL"] as any } } }),
      prisma.user.count(),
      prisma.sale.aggregate({ where: { createdAt: { gte: today, lt: tomorrow } }, _count: true }),
      prisma.tenant.findMany({
        include: { plan: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      stats: { totalTenants, activeTenants, totalUsers, todaySales: todaySalesAgg._count },
      tenants,
    });
  } catch (e: any) {
    console.error("Superadmin stats error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
