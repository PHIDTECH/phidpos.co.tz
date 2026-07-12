import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkSA() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") return null;
  return session;
}

export async function GET() {
  if (!await checkSA()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const config = await (prisma as any).selcomConfig.findFirst({ orderBy: { createdAt: "desc" } });
    if (!config) return NextResponse.json({ config: null });
    // mask secret
    return NextResponse.json({
      config: { ...config, apiSecret: config.apiSecret ? "••••••••" : "" },
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await checkSA()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { vendorId, apiKey, apiSecret, environment } = await req.json();
    if (!vendorId || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    const existing = await (prisma as any).selcomConfig.findFirst({ orderBy: { createdAt: "desc" } });
    const config = existing
      ? await (prisma as any).selcomConfig.update({
          where: { id: existing.id },
          data: { vendorId, apiKey, apiSecret, environment: environment || "production" },
        })
      : await (prisma as any).selcomConfig.create({
          data: { vendorId, apiKey, apiSecret, environment: environment || "production" },
        });
    return NextResponse.json({ config: { ...config, apiSecret: "••••••••" } });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
