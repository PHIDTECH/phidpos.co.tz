import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "phidpos-reset-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const password = "Phidtech@@2023";
    const hash = await bcrypt.hash(password, 12);

    const users = [
      { email: "phidtechnology@gmail.com", name: "Super Admin", role: "SUPER_ADMIN" },
      { email: "bagokap.8275@gmail.com", name: "Demo Admin", role: "TENANT_ADMIN" },
    ];

    const results = [];

    for (const u of users) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (existing) {
        await prisma.user.update({
          where: { email: u.email },
          data: { password: hash, isActive: true },
        });
        results.push(`✅ Reset password for: ${u.email}`);
      } else {
        results.push(`⚠️ User not found: ${u.email} — run seed-init first`);
      }
    }

    // Also list all users for debugging
    const allUsers = await prisma.user.findMany({
      select: { email: true, role: true, isActive: true, name: true },
    });

    return NextResponse.json({
      success: true,
      results,
      allUsers,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
