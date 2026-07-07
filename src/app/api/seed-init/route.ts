import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { PlanType, UserRole, AccountType, CustomerType } from "@prisma/client";

const SECRET = process.env.SEED_SECRET || "phidpos-init-2024";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results: string[] = [];

    // Plans
    const starterPlan = await prisma.plan.upsert({
      where: { type: PlanType.STARTER },
      update: {},
      create: {
        name: "Starter", type: PlanType.STARTER, description: "Best for small retail shops",
        monthlyPrice: 29000, yearlyPrice: 299000, maxStores: 1, maxUsers: 2,
        features: { pos: true, inventory: true, basicReports: true, suppliers: false, purchaseOrders: false, barcode: false, sms: false, accounting: false, customerDebt: false, loyalty: false, multiStore: false, wholesalePricing: false, advancedReports: false },
      },
    });
    const professionalPlan = await prisma.plan.upsert({
      where: { type: PlanType.PROFESSIONAL },
      update: {},
      create: {
        name: "Professional", type: PlanType.PROFESSIONAL, description: "Best for wholesale & multi-branch shops",
        monthlyPrice: 149000, yearlyPrice: 1490000, maxStores: -1, maxUsers: -1,
        features: { pos: true, inventory: true, basicReports: true, suppliers: true, purchaseOrders: true, barcode: true, sms: true, accounting: true, customerDebt: true, loyalty: true, multiStore: true, wholesalePricing: true, advancedReports: true },
      },
    });
    await prisma.plan.upsert({
      where: { type: PlanType.BUSINESS },
      update: {},
      create: {
        name: "Business", type: PlanType.BUSINESS, description: "Best for growing shops",
        monthlyPrice: 79000, yearlyPrice: 799000, maxStores: 2, maxUsers: 5,
        features: { pos: true, inventory: true, basicReports: true, suppliers: true, purchaseOrders: true, barcode: true, sms: true, accounting: false, customerDebt: false, loyalty: false, multiStore: true, wholesalePricing: false, advancedReports: false },
      },
    });
    results.push("✅ Plans created");

    // Super Admin
    const superAdminPassword = await bcrypt.hash("Phidtech@@2023", 12);
    await prisma.user.upsert({
      where: { email: "phidtechnology@gmail.com" },
      update: { password: superAdminPassword, isActive: true },
      create: { name: "Super Admin", email: "phidtechnology@gmail.com", password: superAdminPassword, role: UserRole.SUPER_ADMIN, isActive: true },
    });
    results.push("✅ Super Admin created: phidtechnology@gmail.com / Phidtech@@2023");

    // Demo Tenant
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const demoTenant = await prisma.tenant.upsert({
      where: { slug: "demo-shop" },
      update: {},
      create: { name: "Demo Retail Shop", slug: "demo-shop", email: "demo@phidpos.co.tz", phone: "+255700000000", address: "Dar es Salaam, Tanzania", currency: "TZS", planId: professionalPlan.id, trialEndsAt: trialEnd },
    });

    await prisma.subscription.upsert({
      where: { id: "demo-subscription" },
      update: {},
      create: { id: "demo-subscription", tenantId: demoTenant.id, planId: professionalPlan.id, status: "TRIAL", amount: professionalPlan.monthlyPrice, startDate: new Date(), endDate: trialEnd, trialEndsAt: trialEnd },
    });

    const demoStore = await prisma.store.upsert({
      where: { id: "demo-store" },
      update: {},
      create: { id: "demo-store", tenantId: demoTenant.id, name: "Main Branch", address: "Kariakoo, Dar es Salaam", phone: "+255700000001", isMain: true },
    });

    const adminPassword = await bcrypt.hash("Phidtech@@2023", 12);
    await prisma.user.upsert({
      where: { email: "bagokap.8275@gmail.com" },
      update: { password: adminPassword, isActive: true, tenantId: demoTenant.id, storeId: demoStore.id },
      create: { name: "Demo Admin", email: "bagokap.8275@gmail.com", password: adminPassword, role: UserRole.TENANT_ADMIN, tenantId: demoTenant.id, storeId: demoStore.id, isActive: true },
    });
    results.push("✅ Demo Admin created: bagokap.8275@gmail.com / Phidtech@@2023");

    // Categories, units, products
    const cat1 = await prisma.category.upsert({ where: { id: "cat-beverages" }, update: {}, create: { id: "cat-beverages", tenantId: demoTenant.id, name: "Beverages" } });
    const cat2 = await prisma.category.upsert({ where: { id: "cat-food" }, update: {}, create: { id: "cat-food", tenantId: demoTenant.id, name: "Food & Groceries" } });
    const pieceUnit = await prisma.unit.upsert({ where: { id: "unit-piece" }, update: {}, create: { id: "unit-piece", tenantId: demoTenant.id, name: "Piece", abbreviation: "pc" } });
    const kgUnit = await prisma.unit.upsert({ where: { id: "unit-kg" }, update: {}, create: { id: "unit-kg", tenantId: demoTenant.id, name: "Kilogram", abbreviation: "kg" } });

    const products = await Promise.all([
      prisma.product.upsert({ where: { id: "prod-1" }, update: {}, create: { id: "prod-1", tenantId: demoTenant.id, categoryId: cat1.id, unitId: pieceUnit.id, name: "Coca Cola 500ml", sku: "COKE-500", barcode: "5000112637922", retailPrice: 1500, wholesalePrice: 1200, costPrice: 900, minStockLevel: 20 } }),
      prisma.product.upsert({ where: { id: "prod-2" }, update: {}, create: { id: "prod-2", tenantId: demoTenant.id, categoryId: cat1.id, unitId: pieceUnit.id, name: "Pepsi 500ml", sku: "PEPSI-500", barcode: "4902102141727", retailPrice: 1500, wholesalePrice: 1200, costPrice: 900, minStockLevel: 20 } }),
      prisma.product.upsert({ where: { id: "prod-3" }, update: {}, create: { id: "prod-3", tenantId: demoTenant.id, categoryId: cat2.id, unitId: kgUnit.id, name: "Sugar", sku: "SUG-KG", barcode: "1234567890123", retailPrice: 3200, wholesalePrice: 3000, costPrice: 2500, minStockLevel: 50 } }),
      prisma.product.upsert({ where: { id: "prod-4" }, update: {}, create: { id: "prod-4", tenantId: demoTenant.id, categoryId: cat2.id, unitId: kgUnit.id, name: "Rice (Mchele)", sku: "RICE-KG", barcode: "9876543210987", retailPrice: 2800, wholesalePrice: 2500, costPrice: 2000, minStockLevel: 100 } }),
    ]);

    for (const product of products) {
      await prisma.inventory.upsert({
        where: { productId_storeId: { productId: product.id, storeId: demoStore.id } },
        update: {},
        create: { productId: product.id, storeId: demoStore.id, quantity: 100 },
      });
    }
    results.push("✅ Products and inventory created");

    // Chart of Accounts
    const accounts = [
      { code: "1000", name: "Cash", type: AccountType.ASSET },
      { code: "1100", name: "Accounts Receivable", type: AccountType.ASSET },
      { code: "2000", name: "Accounts Payable", type: AccountType.LIABILITY },
      { code: "4000", name: "Sales Revenue", type: AccountType.REVENUE },
      { code: "5000", name: "Cost of Goods Sold", type: AccountType.EXPENSE },
    ];
    for (const account of accounts) {
      await prisma.account.upsert({
        where: { tenantId_code: { tenantId: demoTenant.id, code: account.code } },
        update: {},
        create: { tenantId: demoTenant.id, ...account, isSystem: true },
      });
    }

    // Loyalty Settings
    await prisma.loyaltySettings.upsert({
      where: { tenantId: demoTenant.id },
      update: {},
      create: { tenantId: demoTenant.id, pointsPerAmount: 1, amountPerPoint: 1000, minRedeemPoints: 100, pointsValueTZS: 1, isActive: true },
    });

    // Demo customers
    await prisma.customer.upsert({ where: { id: "customer-1" }, update: {}, create: { id: "customer-1", tenantId: demoTenant.id, name: "John Mwamba", phone: "+255712345678", type: CustomerType.RETAIL, loyaltyPoints: 150 } });
    await prisma.customer.upsert({ where: { id: "customer-2" }, update: {}, create: { id: "customer-2", tenantId: demoTenant.id, name: "Fatuma Traders Ltd", phone: "+255756789012", type: CustomerType.WHOLESALE, creditLimit: 500000 } });

    results.push("✅ Database seed complete!");

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      details: results,
      credentials: {
        superAdmin: { email: "phidtechnology@gmail.com", password: "Phidtech@@2023" },
        demoAdmin: { email: "bagokap.8275@gmail.com", password: "Phidtech@@2023" },
      }
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
