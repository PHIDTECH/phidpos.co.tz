import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function getTenantId() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId || !["TENANT_ADMIN", "STORE_MANAGER"].includes(role)) return null;
  return { tenantId, role };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth_ = await getTenantId();
  if (!auth_) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Verify user belongs to same tenant
  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing || existing.tenantId !== auth_.tenantId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email;
  if (body.role !== undefined) data.role = body.role;
  if (body.storeId !== undefined) data.storeId = body.storeId || null;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.password) data.password = await bcrypt.hash(body.password, 12);

  const user = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth_ = await getTenantId();
  if (!auth_) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing || existing.tenantId !== auth_.tenantId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
