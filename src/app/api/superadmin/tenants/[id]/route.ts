import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkSA() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") return null;
  return session;
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await checkSA()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.planId !== undefined) data.planId = body.planId;
  if (body.status !== undefined) data.status = body.status;
  const tenant = await prisma.tenant.update({ where: { id }, data });
  return NextResponse.json({ tenant });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await checkSA()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  await prisma.tenant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
