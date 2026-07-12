import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const dateFilter = from && to ? { gte: new Date(from), lte: new Date(to + "T23:59:59") } : undefined;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Subscription revenue
    const subscriptions = await prisma.subscription.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      include: {
        tenant: { select: { id: true, name: true, email: true, status: true } },
        plan: { select: { name: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const subscriptionRevenue = subscriptions
      .filter(s => s.status === "ACTIVE")
      .reduce((sum, s) => sum + Number(s.amount), 0);

    const monthlySubscriptionRevenue = subscriptions
      .filter(s => s.status === "ACTIVE" && new Date(s.createdAt) >= monthStart)
      .reduce((sum, s) => sum + Number(s.amount), 0);

    // All tenant sales revenue (aggregated per tenant)
    const salesByTenant = await prisma.sale.groupBy({
      by: ["tenantId"],
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      _sum: { total: true },
      _count: true,
    });

    const tenantIds = salesByTenant.map(s => s.tenantId);
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true, email: true },
    });

    const tenantSalesRows = salesByTenant.map(s => ({
      tenantId: s.tenantId,
      tenantName: tenants.find(t => t.id === s.tenantId)?.name || "Unknown",
      tenantEmail: tenants.find(t => t.id === s.tenantId)?.email || "",
      totalSales: s._count,
      totalRevenue: Number(s._sum.total || 0),
    }));

    const totalTenantSalesRevenue = tenantSalesRows.reduce((sum, r) => sum + r.totalRevenue, 0);

    // Monthly tenant sales
    const monthlySales = await prisma.sale.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { total: true },
      _count: true,
    });

    return NextResponse.json({
      subscriptions,
      subscriptionRevenue,
      monthlySubscriptionRevenue,
      tenantSalesRows,
      totalTenantSalesRevenue,
      monthlyTenantSalesRevenue: Number(monthlySales._sum.total || 0),
      totalRevenue: subscriptionRevenue + totalTenantSalesRevenue,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
