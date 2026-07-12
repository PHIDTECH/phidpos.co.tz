import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Selcom webhook — called when payment is confirmed or fails
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body?.order_id || body?.data?.order_id;
    const status = body?.result || body?.data?.result; // CONFIRMED or FAILED

    if (!orderId) return NextResponse.json({ ok: false });

    const purchase = await (prisma as any).smsPurchase.findUnique({
      where: { id: orderId },
    });
    if (!purchase) return NextResponse.json({ ok: false });

    if (status === "CONFIRMED" || status === "SUCCESS") {
      // Mark paid and credit SMS balance
      await (prisma as any).smsPurchase.update({
        where: { id: orderId },
        data: { status: "PAID", paymentRef: body?.data?.reference || purchase.paymentRef },
      });
      await prisma.tenant.update({
        where: { id: purchase.tenantId },
        data: { smsBalance: { increment: purchase.smsCount } },
      });
    } else if (status === "FAILED" || status === "CANCELLED") {
      await (prisma as any).smsPurchase.update({
        where: { id: orderId },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
