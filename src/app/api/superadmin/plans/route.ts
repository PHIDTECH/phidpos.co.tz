import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const plans = await prisma.plan.findMany({ orderBy: { monthlyPrice: "asc" } });
  return NextResponse.json({ plans });
}
