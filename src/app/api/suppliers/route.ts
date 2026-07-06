import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const suppliers = await prisma.supplier.findMany({
      where: {
        tenantId: (session?.user as any).tenantId,
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }),
      },
      include: { _count: { select: { purchases: true, purchaseOrders: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ suppliers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const supplier = await prisma.supplier.create({
      data: {
        tenantId: (session?.user as any).tenantId,
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
      },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
