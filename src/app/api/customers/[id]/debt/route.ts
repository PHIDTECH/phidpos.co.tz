import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendSMS, buildPaymentConfirmation } from "@/lib/sms";
import { generateReceiptNumber } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = (session?.user as any).tenantId;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { amount, saleId, note } = body;

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0 || paymentAmount > Number(customer.totalDebt)) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.debtPayment.create({
        data: {
          customerId: customer.id,
          saleId: saleId || null,
          amount: paymentAmount,
          note: note || null,
        },
      });

      await tx.customer.update({
        where: { id: customer.id },
        data: { totalDebt: { decrement: paymentAmount } },
      });

      return newPayment;
    });

    // SMS notification
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant?.smsApiKey && customer.phone) {
      sendSMS({
        to: customer.phone,
        message: buildPaymentConfirmation({
          customerName: customer.name,
          shopName: tenant.name,
          amountPaid: paymentAmount,
          currency: tenant.currency,
          receiptNumber: generateReceiptNumber(),
        }),
        apiKey: tenant.smsApiKey || undefined,
        senderId: tenant.smsSenderId || undefined,
      }).catch(console.error);
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = (session?.user as any).tenantId;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payments = await prisma.debtPayment.findMany({
      where: { customerId: id, customer: { tenantId } },
      include: { sale: { select: { receiptNumber: true, total: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payments });
  } catch {
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
