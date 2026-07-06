import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || new Date(new Date().setDate(1)).toISOString().split("T")[0];
    const to = searchParams.get("to") || new Date().toISOString().split("T")[0];

    const dateFilter = {
      gte: new Date(from),
      lte: new Date(to + "T23:59:59"),
    };

    const [expenses, salesSummary, debtSummary] = await Promise.all([
      prisma.expense.findMany({
        where: { tenantId, date: dateFilter },
        orderBy: { date: "desc" },
      }),
      prisma.sale.aggregate({
        where: { tenantId, createdAt: dateFilter },
        _sum: { total: true },
      }),
      prisma.sale.aggregate({
        where: { tenantId, debtAmount: { gt: 0 } },
        _sum: { debtAmount: true },
      }),
    ]);

    const totalRevenue = Number(salesSummary._sum.total || 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;
    const outstanding = Number(debtSummary._sum.debtAmount || 0);

    return NextResponse.json({
      expenses,
      summary: { totalRevenue, totalExpenses, netProfit, outstanding },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch accounting data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;
    const userId = session?.user?.id;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { description, amount, category, date, note } = body;

    if (!description || !amount) {
      return NextResponse.json({ error: "Description and amount are required" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        tenantId,
        description,
        amount: parseFloat(amount),
        category: category || "OPERATING",
        date: new Date(date || new Date()),
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to record expense" }, { status: 500 });
  }
}
