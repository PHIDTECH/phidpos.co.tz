import { PrismaClient, PlanType, UserRole, AccountType, CustomerType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Plans
  const starterPlan = await prisma.plan.upsert({
    where: { type: PlanType.STARTER },
    update: {},
    create: {
      name: "Starter",
      type: PlanType.STARTER,
      description: "Best for small retail shops",
      monthlyPrice: 30000,
      yearlyPrice: 360000,
      maxStores: 1,
      maxUsers: 2,
      features: {
        pos: true,
        inventory: true,
        basicReports: true,
        suppliers: false,
        purchaseOrders: false,
        barcode: false,
        sms: false,
        accounting: false,
        customerDebt: false,
        loyalty: false,
        multiStore: false,
        wholesalePricing: false,
        advancedReports: false,
      },
    },
  });

  const businessPlan = await prisma.plan.upsert({
    where: { type: PlanType.BUSINESS },
    update: {},
    create: {
      name: "Business",
      type: PlanType.BUSINESS,
      description: "Best for growing shops",
      monthlyPrice: 50000,
      yearlyPrice: 150000,
      maxStores: 2,
      maxUsers: 5,
      features: {
        pos: true,
        inventory: true,
        basicReports: true,
        suppliers: true,
        purchaseOrders: true,
        barcode: true,
        sms: true,
        accounting: false,
        customerDebt: false,
        loyalty: false,
        multiStore: true,
        wholesalePricing: false,
        advancedReports: false,
      },
    },
  });

  const professionalPlan = await prisma.plan.upsert({
    where: { type: PlanType.PROFESSIONAL },
    update: {},
    create: {
      name: "Professional",
      type: PlanType.PROFESSIONAL,
      description: "Best for wholesale & multi-branch shops",
      monthlyPrice: 70000,
      yearlyPrice: 1490000,
      maxStores: -1,
      maxUsers: -1,
      features: {
        pos: true,
        inventory: true,
        basicReports: true,
        suppliers: true,
        purchaseOrders: true,
        barcode: true,
        sms: true,
        accounting: true,
        customerDebt: true,
        loyalty: true,
        multiStore: true,
        wholesalePricing: true,
        advancedReports: true,
      },
    },
  });

  console.log("✅ Plans created");

  // Create Super Admin
  // Remove old superadmin if exists with different email
  await prisma.user.deleteMany({ where: { role: UserRole.SUPER_ADMIN } });

  const superAdminPassword = await bcrypt.hash("Phidtech@@2023", 12);
  const superAdmin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "phidtechnology@gmail.com",
      password: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log("✅ Super Admin created");

  // Create Demo Tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: "demo-shop" },
    update: {},
    create: {
      name: "Demo Retail Shop",
      slug: "demo-shop",
      email: "demo@phidpos.co.tz",
      phone: "+255700000000",
      address: "Dar es Salaam, Tanzania",
      currency: "TZS",
      planId: professionalPlan.id,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // Create subscription for demo tenant
  await prisma.subscription.upsert({
    where: { id: "demo-subscription" },
    update: {},
    create: {
      id: "demo-subscription",
      tenantId: demoTenant.id,
      planId: professionalPlan.id,
      status: "TRIAL",
      amount: professionalPlan.monthlyPrice,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // Create Demo Store
  const demoStore = await prisma.store.upsert({
    where: { id: "demo-store" },
    update: {},
    create: {
      id: "demo-store",
      tenantId: demoTenant.id,
      name: "Main Branch",
      address: "Kariakoo, Dar es Salaam",
      phone: "+255700000001",
      isMain: true,
    },
  });

  // Create Demo Admin
  // Remove old tenant admin if exists
  await prisma.user.deleteMany({ where: { role: UserRole.TENANT_ADMIN, tenantId: demoTenant.id } });

  const adminPassword = await bcrypt.hash("Phidtech@@2023", 12);
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "bagokap.8275@gmail.com",
      password: adminPassword,
      role: UserRole.TENANT_ADMIN,
      tenantId: demoTenant.id,
      storeId: demoStore.id,
    },
  });

  const cashierPassword = await bcrypt.hash("Cashier@1234", 12);
  await prisma.user.upsert({
    where: { email: "cashier@demo-shop.com" },
    update: {},
    create: {
      name: "Demo Cashier",
      email: "cashier@demo-shop.com",
      password: cashierPassword,
      role: UserRole.CASHIER,
      tenantId: demoTenant.id,
      storeId: demoStore.id,
    },
  });

  console.log("✅ Demo tenant, store and users created");

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: "cat-beverages" },
      update: {},
      create: { id: "cat-beverages", tenantId: demoTenant.id, name: "Beverages" },
    }),
    prisma.category.upsert({
      where: { id: "cat-food" },
      update: {},
      create: { id: "cat-food", tenantId: demoTenant.id, name: "Food & Groceries" },
    }),
    prisma.category.upsert({
      where: { id: "cat-electronics" },
      update: {},
      create: { id: "cat-electronics", tenantId: demoTenant.id, name: "Electronics" },
    }),
  ]);

  // Create Units
  const pieceUnit = await prisma.unit.upsert({
    where: { id: "unit-piece" },
    update: {},
    create: { id: "unit-piece", tenantId: demoTenant.id, name: "Piece", abbreviation: "pc" },
  });
  const kgUnit = await prisma.unit.upsert({
    where: { id: "unit-kg" },
    update: {},
    create: { id: "unit-kg", tenantId: demoTenant.id, name: "Kilogram", abbreviation: "kg" },
  });

  // Create Products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: "prod-1" },
      update: {},
      create: {
        id: "prod-1",
        tenantId: demoTenant.id,
        categoryId: categories[0].id,
        unitId: pieceUnit.id,
        name: "Coca Cola 500ml",
        sku: "COKE-500",
        barcode: "5000112637922",
        retailPrice: 1500,
        wholesalePrice: 1200,
        costPrice: 900,
        minStockLevel: 20,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-2" },
      update: {},
      create: {
        id: "prod-2",
        tenantId: demoTenant.id,
        categoryId: categories[0].id,
        unitId: pieceUnit.id,
        name: "Pepsi 500ml",
        sku: "PEPSI-500",
        barcode: "4902102141727",
        retailPrice: 1500,
        wholesalePrice: 1200,
        costPrice: 900,
        minStockLevel: 20,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-3" },
      update: {},
      create: {
        id: "prod-3",
        tenantId: demoTenant.id,
        categoryId: categories[1].id,
        unitId: kgUnit.id,
        name: "Sugar",
        sku: "SUG-KG",
        barcode: "1234567890123",
        retailPrice: 3200,
        wholesalePrice: 3000,
        costPrice: 2500,
        minStockLevel: 50,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-4" },
      update: {},
      create: {
        id: "prod-4",
        tenantId: demoTenant.id,
        categoryId: categories[1].id,
        unitId: kgUnit.id,
        name: "Rice (Mchele)",
        sku: "RICE-KG",
        barcode: "9876543210987",
        retailPrice: 2800,
        wholesalePrice: 2500,
        costPrice: 2000,
        minStockLevel: 100,
      },
    }),
  ]);

  // Create Inventory
  for (const product of products) {
    await prisma.inventory.upsert({
      where: { productId_storeId: { productId: product.id, storeId: demoStore.id } },
      update: {},
      create: {
        productId: product.id,
        storeId: demoStore.id,
        quantity: 100,
      },
    });
  }

  console.log("✅ Products and inventory created");

  // Create Chart of Accounts
  const accounts = [
    { code: "1000", name: "Cash", type: AccountType.ASSET },
    { code: "1100", name: "Accounts Receivable", type: AccountType.ASSET },
    { code: "1200", name: "Inventory", type: AccountType.ASSET },
    { code: "2000", name: "Accounts Payable", type: AccountType.LIABILITY },
    { code: "3000", name: "Owner's Equity", type: AccountType.EQUITY },
    { code: "4000", name: "Sales Revenue", type: AccountType.REVENUE },
    { code: "5000", name: "Cost of Goods Sold", type: AccountType.EXPENSE },
    { code: "5100", name: "Operating Expenses", type: AccountType.EXPENSE },
  ];

  for (const account of accounts) {
    await prisma.account.upsert({
      where: { tenantId_code: { tenantId: demoTenant.id, code: account.code } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        ...account,
        isSystem: true,
      },
    });
  }

  // Create Loyalty Settings
  await prisma.loyaltySettings.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      pointsPerAmount: 1,
      amountPerPoint: 1000,
      minRedeemPoints: 100,
      pointsValueTZS: 1,
      isActive: true,
    },
  });

  // Create demo supplier
  await prisma.supplier.upsert({
    where: { id: "supplier-1" },
    update: {},
    create: {
      id: "supplier-1",
      tenantId: demoTenant.id,
      name: "Azam Beverages Ltd",
      phone: "+255711000001",
      email: "azam@supplier.com",
      address: "Industrial Area, Dar es Salaam",
    },
  });

  // Create demo customers
  await prisma.customer.upsert({
    where: { id: "customer-1" },
    update: {},
    create: {
      id: "customer-1",
      tenantId: demoTenant.id,
      name: "John Mwamba",
      phone: "+255712345678",
      type: CustomerType.RETAIL,
      loyaltyPoints: 150,
    },
  });

  await prisma.customer.upsert({
    where: { id: "customer-2" },
    update: {},
    create: {
      id: "customer-2",
      tenantId: demoTenant.id,
      name: "Fatuma Traders Ltd",
      phone: "+255756789012",
      type: CustomerType.WHOLESALE,
      creditLimit: 500000,
    },
  });

  console.log("✅ Accounts, loyalty settings, suppliers and customers created");
  console.log("\n✅ Database seeding complete!");
  console.log("\n📋 Login Credentials:");
  console.log("   Super Admin: superadmin@phidpos.co.tz / Admin@1234");
  console.log("   Demo Admin:  admin@demo-shop.com / Admin@1234");
  console.log("   Demo Cashier: cashier@demo-shop.com / Cashier@1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
