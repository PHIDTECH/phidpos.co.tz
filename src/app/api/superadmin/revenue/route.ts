import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        tenant: { select: { id: true, name: true, email: true, status: true } },
        plan: { select: { name: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalRevenue = subscriptions
      .filter(s => s.status === "ACTIVE")
      .reduce((sum, s) => sum + Number(s.amount), 0);

    const monthlyRevenue = subscriptions
      .filter(s => {
        const d = new Date(s.createdAt);
        const now = new Date();
        return s.status === "ACTIVE" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, s) => sum + Number(s.amount), 0);

    return NextResponse.json({ subscriptions, totalRevenue, monthlyRevenue });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
