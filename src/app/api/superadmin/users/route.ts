import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkSA() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN")
    return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!await checkSA()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const search = req.nextUrl.searchParams.get("search") || "";
  const users = await prisma.user.findMany({
    where: search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    } : {},
    include: { tenant: { select: { id: true, name: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json({ users });
}
