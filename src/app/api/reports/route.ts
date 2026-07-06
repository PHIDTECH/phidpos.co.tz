import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "sales";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const storeId = searchParams.get("storeId") || (session?.user as any).storeId;

    const tenantId = (session?.user as any).tenantId;
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(1));
    const toDate = to ? new Date(to + "T23:59:59") : new Date();

    const saleWhere: any = {
      tenantId,
      ...(storeId && { storeId }),
      createdAt: { gte: fromDate, lte: toDate },
    };

    if (type === "sales") {
      const sales = await prisma.sale.findMany({
        where: saleWhere,
        include: {
          customer: { select: { name: true } },
          user: { select: { name: true } },
          store: { select: { name: true } },
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      const summary = await prisma.sale.aggregate({
        where: saleWhere,
        _sum: { total: true, discount: true, tax: true, debtAmount: true },
        _count: true,
      });

      return NextResponse.json({ sales, summary });
    }

    if (type === "inventory") {
      const inventories = await prisma.inventory.findMany({
        where: { store: { tenantId }, ...(storeId && { storeId }) },
        include: {
          product: { include: { category: true, unit: true } },
          store: { select: { name: true } },
        },
      });

      const movements = await prisma.inventoryMovement.findMany({
        where: {
          tenantId,
          ...(storeId && { storeId }),
          createdAt: { gte: fromDate, lte: toDate },
        },
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json({ inventories, movements });
    }

    if (type === "profit") {
      const sales = await prisma.sale.findMany({
        where: saleWhere,
        include: {
          items: { include: { product: { select: { costPrice: true } } } },
        },
      });

      const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
      const totalCOGS = sales.reduce((sum, s) => {
        return sum + s.items.reduce((itemSum, item) => {
          return itemSum + (Number(item.product?.costPrice || 0) * Number(item.quantity));
        }, 0);
      }, 0);

      const expenses = await prisma.expense.aggregate({
        where: { tenantId, date: { gte: fromDate, lte: toDate } },
        _sum: { amount: true },
      });

      const grossProfit = totalRevenue - totalCOGS;
      const totalExpenses = Number(expenses._sum.amount || 0);
      const netProfit = grossProfit - totalExpenses;

      return NextResponse.json({
        totalRevenue,
        totalCOGS,
        grossProfit,
        grossMargin: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : "0",
        totalExpenses,
        netProfit,
        salesCount: sales.length,
      });
    }

    if (type === "customers") {
      const customers = await prisma.customer.findMany({
        where: { tenantId },
        include: {
          _count: { select: { sales: true } },
          sales: {
            where: saleWhere,
            select: { total: true },
          },
        },
        orderBy: { totalDebt: "desc" },
      });

      const formatted = customers.map((c) => ({
        ...c,
        totalPurchased: c.sales.reduce((sum, s) => sum + Number(s.total), 0),
      }));

      return NextResponse.json({ customers: formatted });
    }

    if (type === "suppliers") {
      const suppliers = await prisma.supplier.findMany({
        where: { tenantId },
        include: {
          purchases: {
            where: { tenantId, createdAt: { gte: fromDate, lte: toDate } },
            select: { total: true, amountPaid: true },
          },
          _count: { select: { purchases: true } },
        },
      });

      return NextResponse.json({ suppliers });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
