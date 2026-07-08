import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkSA() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") return null;
  return session;
}

// GET: list all tenants with their sender ID status
export async function GET() {
  if (!await checkSA()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, email: true, smsSenderId: true, smsApiKey: true },
    orderBy: { createdAt: "desc" },
  });

  const result = tenants.map(t => ({
    id: t.id,
    name: t.name,
    email: t.email,
    senderId: t.smsSenderId,
    approved: !!(t.smsSenderId && t.smsApiKey),
    hasApplication: !!t.smsSenderId,
  }));

  return NextResponse.json({ senderIds: result });
}

// POST: approve a tenant's sender ID and set their Beem API key
export async function POST(req: NextRequest) {
  if (!await checkSA()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tenantId, apiKey, approve } = await req.json();
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  if (approve === false) {
    // Revoke
    await prisma.tenant.update({ where: { id: tenantId }, data: { smsApiKey: null } });
    return NextResponse.json({ ok: true, message: "Sender ID revoked" });
  }

  if (!apiKey?.trim()) return NextResponse.json({ error: "Beem API key required to approve" }, { status: 400 });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { smsApiKey: apiKey.trim() },
  });

  return NextResponse.json({ ok: true, message: "Sender ID approved" });
}
