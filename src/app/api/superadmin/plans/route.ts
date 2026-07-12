import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || !["SUPER_ADMIN","TENANT_ADMIN"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const plans = await prisma.plan.findMany({ orderBy: { monthlyPrice: "asc" } });
  return NextResponse.json({ plans });
}
