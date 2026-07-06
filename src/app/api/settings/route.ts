import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenant = await prisma.tenant.findUnique({
      where: { id: (session?.user as any).tenantId },
      select: { name: true, phone: true, email: true, address: true, currency: true, timezone: true },
    });

    return NextResponse.json({ settings: tenant });
  } catch {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, phone, email, address, currency, timezone } = body;

    const tenant = await prisma.tenant.update({
      where: { id: (session?.user as any)?.tenantId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(currency && { currency }),
        ...(timezone && { timezone }),
      },
    });

    return NextResponse.json({ tenant });
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
