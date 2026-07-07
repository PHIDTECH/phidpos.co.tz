import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole, PlanType } from "@prisma/client";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 50);
}

export async function POST(req: NextRequest) {
  try {
    const { shopName, name, email, password, phone, address } = await req.json();

    if (!shopName || !name || !email || !password) {
      return NextResponse.json({ error: "Jaza sehemu zote zinazohitajika." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Nywila iwe na herufi 8 au zaidi." }, { status: 400 });
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Barua pepe hiyo tayari imetumika." }, { status: 409 });
    }

    // Get starter plan
    const plan = await prisma.plan.findFirst({ where: { type: PlanType.STARTER } });
    if (!plan) {
      return NextResponse.json({ error: "Mipango ya bei haijapatikana. Wasiliana na msaada." }, { status: 500 });
    }

    // Generate unique slug
    let baseSlug = slugify(shopName);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create tenant, store, user in transaction
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: shopName,
          slug,
          email,
          phone: phone || null,
          address: address || null,
          currency: "TZS",
          planId: plan.id,
          trialEndsAt: trialEnd,
        },
      });

      const store = await tx.store.create({
        data: {
          tenantId: tenant.id,
          name: "Tawi Kuu",
          address: address || "Tanzania",
          isMain: true,
        },
      });

      await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: UserRole.TENANT_ADMIN,
          tenantId: tenant.id,
          storeId: store.id,
        },
      });

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: "TRIAL",
          amount: plan.monthlyPrice,
          startDate: new Date(),
          endDate: trialEnd,
          trialEndsAt: trialEnd,
        },
      });
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Hitilafu ya seva. Jaribu tena." }, { status: 500 });
  }
}
