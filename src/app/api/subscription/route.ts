import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: (session?.user as any).tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscription });
  } catch {
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId as string | undefined;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["TENANT_ADMIN", "SUPER_ADMIN"].includes((session?.user as any)?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { planId, billingCycle } = await req.json();
    if (!planId) return NextResponse.json({ error: "Plan ID required" }, { status: 400 });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (billingCycle === "YEARLY" ? 12 : 1));

    const existing = await prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    const subscription = existing
      ? await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            planId,
            billingCycle: billingCycle || "MONTHLY",
            status: "ACTIVE",
            amount: plan.monthlyPrice,
            endDate,
          },
        })
      : await prisma.subscription.create({
          data: {
            tenantId,
            planId,
            billingCycle: billingCycle || "MONTHLY",
            status: "ACTIVE",
            amount: plan.monthlyPrice,
            startDate: new Date(),
            endDate,
          },
        });

    return NextResponse.json({ subscription });
  } catch {
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
