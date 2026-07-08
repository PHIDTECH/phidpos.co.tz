import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: fetch current sender ID status
export async function GET() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { smsSenderId: true, smsApiKey: true },
  });

  return NextResponse.json({
    senderId: tenant?.smsSenderId || null,
    hasApiKey: !!tenant?.smsApiKey,
    // approved = senderId is set and smsApiKey is set (superadmin approves by setting apiKey)
    approved: !!(tenant?.smsSenderId && tenant?.smsApiKey),
  });
}

// POST: tenant applies for a sender ID
export async function POST(req: NextRequest) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { senderId } = await req.json();
  if (!senderId?.trim()) return NextResponse.json({ error: "Sender ID required" }, { status: 400 });

  // Store senderId but clear smsApiKey until approved
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { smsSenderId: senderId.trim().toUpperCase(), smsApiKey: null },
  });

  return NextResponse.json({ ok: true, message: "Sender ID application submitted. Awaiting superadmin approval." });
}
