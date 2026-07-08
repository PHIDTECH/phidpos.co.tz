import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BEEM_API_KEY = process.env.BEEM_API_KEY || "";
const BEEM_SECRET  = process.env.BEEM_SECRET  || "";
const SENDER_ID    = "PHIDTECH";

async function sendBeemSms(to: string, message: string) {
  const credentials = Buffer.from(`${BEEM_API_KEY}:${BEEM_SECRET}`).toString("base64");
  const res = await fetch("https://apisms.beem.africa/v1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      source_addr: SENDER_ID,
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
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tenantIds, message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  // Fetch tenant phones/emails
  const tenants = await prisma.tenant.findMany({
    where: tenantIds?.length ? { id: { in: tenantIds } } : {},
    select: { id: true, name: true, phone: true, email: true },
  });

  const results: { tenantId: string; name: string; ok: boolean }[] = [];
  for (const t of tenants) {
    if (t.phone) {
      const ok = await sendBeemSms(t.phone, message);
      results.push({ tenantId: t.id, name: t.name, ok });
    } else {
      results.push({ tenantId: t.id, name: t.name, ok: false });
    }
  }

  // Log to SmsLog table if it exists
  try {
    for (const t of tenants) {
      if (t.phone) {
        await prisma.smsLog.create({
          data: {
            tenantId: t.id,
            to: t.phone!,
            message,
            status: results.find(r => r.tenantId === t.id)?.ok ? "SENT" : "FAILED",
            provider: "BEEM",
          },
        });
      }
    }
  } catch { /* smsLog optional */ }

  return NextResponse.json({ results });
}

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const logs = await prisma.smsLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { tenant: { select: { name: true } } },
    });
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}
