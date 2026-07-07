import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session?.user as any)?.role;
    const tenantId = (session?.user as any).tenantId;
    const storeId = (session?.user as any).storeId;

    // SUPER_ADMIN with no tenant — return empty stats
    if (!tenantId) {
      return NextResponse.json({
        stats: { todaySales: 0, todayRevenue: 0, totalProducts: 0, lowStockProducts: 0, totalCustomers: 0, monthlyRevenue: 0, monthlySales: 0, pendingDebt: 0 },
        recentSales: [], topProducts: [], weeklyChart: [],
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const saleWhere: any = { tenantId, ...(storeId && { storeId }) };

    const [
      todaySalesData,
      monthlySalesData,
      totalProducts,
      lowStockCount,
      totalCustomers,
      pendingDebt,
      recentSales,
      topProducts,
      weeklyChart,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { ...saleWhere, createdAt: { gte: today, lt: tomorrow } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { ...saleWhere, createdAt: { gte: monthStart } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.product.count({ where: { tenantId, isActive: true } }),
      prisma.inventory.count({
        where: {
          store: { tenantId },
          ...(storeId && { storeId }),
        },
      }).then(async () => {
        const inventories = await prisma.inventory.findMany({
          where: { store: { tenantId }, ...(storeId && { storeId }) },
          include: { product: true },
        });
        return inventories.filter((i) => Number(i.quantity) <= i.product.minStockLevel).length;
      }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.customer.aggregate({
        where: { tenantId },
        _sum: { totalDebt: true },
      }),
      prisma.sale.findMany({
        where: saleWhere,
        include: {
          customer: { select: { name: true } },
          user: { select: { name: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
          sale: { ...saleWhere, createdAt: { gte: monthStart } },
        },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
      // Last 7 days chart
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          d.setHours(0, 0, 0, 0);
          const next = new Date(d);
          next.setDate(next.getDate() + 1);
          return prisma.sale.aggregate({
            where: { ...saleWhere, createdAt: { gte: d, lt: next } },
            _sum: { total: true },
            _count: true,
          }).then((data) => ({
            date: d.toISOString().split("T")[0],
            revenue: Number(data._sum.total || 0),
            sales: data._count,
          }));
        })
      ),
    ]);

    // Get top products with names
    const topProductIds = topProducts.map((p) => p.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true },
    });

    const topProductsFormatted = topProducts.map((tp) => ({
      productId: tp.productId,
      name: topProductDetails.find((p) => p.id === tp.productId)?.name || "Unknown",
      totalQty: Number(tp._sum.quantity || 0),
      totalRevenue: Number(tp._sum.total || 0),
    }));

    return NextResponse.json({
      stats: {
        todaySales: todaySalesData._count,
        todayRevenue: Number(todaySalesData._sum.total || 0),
        totalProducts,
        lowStockProducts: lowStockCount,
        totalCustomers,
        monthlyRevenue: Number(monthlySalesData._sum.total || 0),
        monthlySales: monthlySalesData._count,
        pendingDebt: Number(pendingDebt._sum.totalDebt || 0),
      },
      recentSales,
      topProducts: topProductsFormatted,
      weeklyChart,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
