import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BUNDLES: Record<string, { sms: number; amount: number }> = {
  SMALL:  { sms: 500,  amount: 5000 },
  MEDIUM: { sms: 1000, amount: 9000 },
  LARGE:  { sms: 5000, amount: 40000 },
};

export async function GET() {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const purchases = await (prisma as any).smsPurchase.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ purchases });
  } catch {
    return NextResponse.json({ purchases: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bundle, phone } = await req.json();
    if (!bundle || !BUNDLES[bundle]) return NextResponse.json({ error: "Bundle si sahihi" }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: "Nambari ya simu inahitajika" }, { status: 400 });

    const { sms, amount } = BUNDLES[bundle];

    // Fetch Selcom config
    const config = await (prisma as any).selcomConfig.findFirst();
    if (!config?.vendorId || !config?.apiKey) {
      return NextResponse.json({ error: "Selcom haijawekwa — wasiliana na msimamizi" }, { status: 503 });
    }

    // Create purchase record (PENDING)
    const purchase = await (prisma as any).smsPurchase.create({
      data: { tenantId, bundle, smsCount: sms, amount, phone: phone.trim(), status: "PENDING" },
    });

    // Initiate Selcom payment push
    try {
      const selcomRes = await fetch(
        config.environment === "sandbox"
          ? "https://apigw.selcommobile.com/v1/checkout/create-order"
          : "https://apigw.selcommobile.com/v1/checkout/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "vendor": config.vendorId,
            "token": config.apiKey,
          },
          body: JSON.stringify({
            vendor: config.vendorId,
            order_id: purchase.id,
            buyer_email: "",
            buyer_name: "Tenant",
            buyer_phone: phone.replace(/\D/g, ""),
            amount,
            currency: "TZS",
            redirect_url: `${process.env.NEXTAUTH_URL || ""}/messages/buy`,
            cancel_url: `${process.env.NEXTAUTH_URL || ""}/messages/buy`,
            webhook: `${process.env.NEXTAUTH_URL || ""}/api/messages/sms-webhook`,
            payment_methods: "ALL",
            items: [{ name: `SMS Bundle ${bundle}`, amount, quantity: 1 }],
          }),
        }
      );

      if (selcomRes.ok) {
        const selcomData = await selcomRes.json();
        // Update with payment reference if returned
        if (selcomData?.data?.reference) {
          await (prisma as any).smsPurchase.update({
            where: { id: purchase.id },
            data: { paymentRef: selcomData.data.reference },
          });
        }
      }
    } catch {
      // Selcom call failed — record stays PENDING, don't fail the request
    }

    return NextResponse.json({
      ok: true,
      message: "Ombi la malipo limetumwa — angalia simu yako kwa ujumbe wa kuthibitisha",
      purchaseId: purchase.id,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Imeshindwa" }, { status: 500 });
  }
}
