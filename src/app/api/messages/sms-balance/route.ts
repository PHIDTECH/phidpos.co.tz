import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { smsBalance: true },
    });

    // Check if Selcom is configured (global config)
    let selcomAvailable = false;
    try {
      const config = await (prisma as any).selcomConfig.findFirst();
      selcomAvailable = !!(config?.vendorId && config?.apiKey);
    } catch {}

    return NextResponse.json({
      balance: tenant?.smsBalance ?? 0,
      selcomAvailable,
    });
  } catch {
    return NextResponse.json({ balance: 0, selcomAvailable: false });
  }
}
