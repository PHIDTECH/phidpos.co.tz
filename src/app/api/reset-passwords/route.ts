import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "phidpos-reset-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results: string[] = [];
    const defaultPassword = "Phidtech@@2023";
    const hash = await bcrypt.hash(defaultPassword, 12);

    // 1. Ensure Super Admin exists and password is correct
    const superAdminEmail = "phidtechnology@gmail.com";
    const existingSA = await prisma.user.findUnique({ where: { email: superAdminEmail } });
    if (existingSA) {
      await prisma.user.update({
        where: { email: superAdminEmail },
        data: { password: hash, isActive: true, role: "SUPER_ADMIN" },
      });
      results.push(`✅ Super Admin reset: ${superAdminEmail}`);
    } else {
      await prisma.user.create({
        data: { name: "Super Admin", email: superAdminEmail, password: hash, role: "SUPER_ADMIN", isActive: true },
      });
      results.push(`✅ Super Admin created: ${superAdminEmail}`);
    }

    // 2. Reset all TENANT_ADMIN users' passwords and ensure their tenants are ACTIVE
    const tenantAdmins = await prisma.user.findMany({
      where: { role: "TENANT_ADMIN" },
      include: { tenant: true },
    });

    for (const u of tenantAdmins) {
      await prisma.user.update({
        where: { id: u.id },
        data: { password: hash, isActive: true },
      });
      if (u.tenant && u.tenant.status !== "ACTIVE") {
        await prisma.tenant.update({
          where: { id: u.tenant.id },
          data: { status: "ACTIVE" },
        });
        results.push(`✅ Tenant activated: ${u.tenant.name}`);
      }
      results.push(`✅ Tenant admin reset: ${u.email}`);
    }

    // 3. Handle james@gmail.com specifically — find by email, reset or create under first available tenant
    const jamesEmail = "james@gmail.com";
    const jamesUser = await prisma.user.findUnique({ where: { email: jamesEmail } });
    if (jamesUser) {
      await prisma.user.update({
        where: { email: jamesEmail },
        data: { password: hash, isActive: true },
      });
      results.push(`✅ james@gmail.com password reset`);
      // Also activate their tenant if needed
      if (jamesUser.tenantId) {
        await prisma.tenant.update({ where: { id: jamesUser.tenantId }, data: { status: "ACTIVE" } });
        results.push(`✅ james tenant activated`);
      }
    } else {
      results.push(`ℹ️ james@gmail.com not found in DB — user may not be registered yet`);
    }

    // 4. Re-activate ALL inactive users that are TENANT_ADMIN or SUPER_ADMIN
    await prisma.user.updateMany({
      where: { role: { in: ["SUPER_ADMIN", "TENANT_ADMIN"] }, isActive: false },
      data: { isActive: true },
    });
    results.push(`✅ All admin users set to active`);

    // 5. List all users for debugging
    const allUsers = await prisma.user.findMany({
      select: { email: true, role: true, isActive: true, name: true, tenantId: true },
      orderBy: { role: "asc" },
    });

    return NextResponse.json({
      success: true,
      results,
      note: `Default password for all reset accounts: ${defaultPassword}`,
      allUsers,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
