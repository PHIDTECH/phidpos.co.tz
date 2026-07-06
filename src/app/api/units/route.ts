import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const units = await prisma.unit.findMany({
      where: { tenantId: (session?.user as any).tenantId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ units });
  } catch {
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, abbreviation } = await req.json();
    if (!name || !abbreviation) return NextResponse.json({ error: "Name and abbreviation are required" }, { status: 400 });

    const unit = await prisma.unit.create({
      data: { tenantId: (session?.user as any).tenantId, name, abbreviation },
    });

    return NextResponse.json({ unit }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 });
  }
}
