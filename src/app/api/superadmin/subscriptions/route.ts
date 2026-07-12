import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkSA() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") return null;
  return session;
}

export async function GET() {
  if (!await checkSA()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, monthlyPrice: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } });
    const plans = await prisma.plan.findMany({ orderBy: { monthlyPrice: "asc" } });
    return NextResponse.json({ subscriptions, tenants, plans });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await checkSA()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { tenantId, planId, status, endDate, notes } = await req.json();
    if (!tenantId || !planId || !status || !endDate) {
      return NextResponse.json({ error: "tenantId, planId, status and endDate are required" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const existing = await prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    const sub = existing
      ? await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            planId,
            status,
            endDate: new Date(endDate),
            amount: plan.monthlyPrice,
            billingCycle: "MONTHLY",
          },
        })
      : await prisma.subscription.create({
          data: {
            tenantId,
            planId,
            status,
            amount: plan.monthlyPrice,
            startDate: new Date(),
            endDate: new Date(endDate),
            billingCycle: "MONTHLY",
          },
        });

    // Also update tenant's planId and status
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        planId,
        status: status === "ACTIVE" ? "ACTIVE" : status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
      },
    });

    return NextResponse.json({ subscription: sub, notes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
