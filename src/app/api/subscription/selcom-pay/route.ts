import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId as string | undefined;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["TENANT_ADMIN"].includes((session?.user as any)?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { planId, billingMonths, phone } = await req.json();
    if (!planId || !billingMonths || !phone) {
      return NextResponse.json({ error: "planId, billingMonths and phone are required" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const selcomConfig = await (prisma as any).selcomConfig.findFirst({ orderBy: { createdAt: "desc" } });
    if (!selcomConfig) {
      return NextResponse.json({ error: "Payment gateway not configured. Contact support." }, { status: 503 });
    }

    const amount = Number(plan.monthlyPrice) * Number(billingMonths);
    const orderId = `SUB-${tenantId.slice(0,8)}-${Date.now()}`;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, email: true } });

    // ── Selcom USSD Push (Mobile Money) ──────────────────────────────────
    // Reference: https://developer.selcom.co.tz/docs#ussd-push
    const selcomBase = selcomConfig.environment === "sandbox"
      ? "https://apigw.selcom.co.tz/v1"
      : "https://apigw.selcom.co.tz/v1";

    const payload = {
      vendor: selcomConfig.vendorId,
      order_id: orderId,
      buyer_phone: phone.replace(/^\+?255/, "255").replace(/^0/, "255"),
      buyer_name: tenant?.name || "Tenant",
      buyer_email: tenant?.email || "",
      amount: amount.toString(),
      currency: "TZS",
      order_info: `PhidPOS ${plan.name} - ${billingMonths} month(s)`,
      redirect_url: `https://www.phidpos.co.tz/subscription?status=success`,
    };

    const timestamp = new Date().toISOString();
    const bodyString = JSON.stringify(payload);

    // HMAC-SHA256 signature as per Selcom docs
    const { createHmac } = await import("crypto");
    const signature = createHmac("sha256", selcomConfig.apiSecret)
      .update(selcomConfig.apiKey + timestamp + bodyString)
      .digest("hex");

    const selcomRes = await fetch(`${selcomBase}/checkout/create-order-minimal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `SELCOM ${selcomConfig.apiKey}`,
        "Digest-Method": "HS256",
        "Digest": signature,
        "Timestamp": timestamp,
        "Cache-Control": "no-cache",
      },
      body: bodyString,
    });

    const selcomData = await selcomRes.json();

    if (!selcomRes.ok || selcomData.resultcode !== "000") {
      return NextResponse.json({
        error: selcomData.result || "Payment initiation failed",
        detail: selcomData,
      }, { status: 400 });
    }

    // Record a PENDING subscription entry to track payment
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + Number(billingMonths));

    const existing = await prisma.subscription.findFirst({ where: { tenantId }, orderBy: { createdAt: "desc" } });
    await (existing
      ? prisma.subscription.update({
          where: { id: existing.id },
          data: { planId, billingCycle: billingMonths === 12 ? "YEARLY" : "MONTHLY", status: "TRIAL", amount: amount, endDate },
        })
      : prisma.subscription.create({
          data: { tenantId, planId, billingCycle: billingMonths === 12 ? "YEARLY" : "MONTHLY", status: "TRIAL", amount: amount, startDate: new Date(), endDate },
        })
    );

    return NextResponse.json({
      ok: true,
      message: "Payment request sent to your phone. Enter PIN to confirm.",
      orderId,
      selcom: selcomData,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Payment failed" }, { status: 500 });
  }
}
