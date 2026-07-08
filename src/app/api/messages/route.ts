import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getBeemCreds(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { smsApiKey: true, smsSenderId: true },
  });
  return { apiKey: tenant?.smsApiKey || "", senderId: tenant?.smsSenderId || "" };
}

async function sendBeem(to: string, message: string, apiKey: string, secret: string, senderId: string) {
  const credentials = Buffer.from(`${apiKey}:${secret}`).toString("base64");
  const res = await fetch("https://apisms.beem.africa/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${credentials}` },
    body: JSON.stringify({
      source_addr: senderId,
      schedule_time: "",
      encoding: 0,
      message,
      recipients: [{ recipient_id: 1, dest_addr: to.replace(/\D/g, "") }],
    }),
  });
  return res.ok;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerIds, phone, message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const { apiKey, senderId } = await getBeemCreds(tenantId);
  if (!apiKey || !senderId) return NextResponse.json({ error: "SMS credentials not configured. Contact superadmin to approve your sender ID." }, { status: 400 });

  const secret = process.env.BEEM_SECRET || "";
  const results: { id: string; name: string; ok: boolean }[] = [];

  if (phone) {
    // Single send
    const ok = await sendBeem(phone, message, apiKey, secret, senderId);
    await prisma.smsLog.create({ data: { tenantId, to: phone, message, status: ok ? "SENT" : "FAILED", provider: "BEEM" } });
    return NextResponse.json({ ok, sent: ok ? 1 : 0 });
  }

  if (customerIds?.length) {
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds }, tenantId },
      select: { id: true, name: true, phone: true },
    });
    for (const c of customers) {
      if (c.phone) {
        const ok = await sendBeem(c.phone, message, apiKey, secret, senderId);
        await prisma.smsLog.create({ data: { tenantId, to: c.phone, message, status: ok ? "SENT" : "FAILED", provider: "BEEM" } });
        results.push({ id: c.id, name: c.name, ok });
      }
    }
  }

  return NextResponse.json({ results, sent: results.filter(r => r.ok).length });
}

export async function GET() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.smsLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ logs });
}
