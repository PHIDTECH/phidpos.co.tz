import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const storeId = searchParams.get("storeId") || (session?.user as any).storeId;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: (session?.user as any).tenantId,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(categoryId && { categoryId }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          unit: true,
          inventories: storeId ? { where: { storeId } } : true,
          variants: true,
        },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, categoryId, unitId, sku, barcode, retailPrice, wholesalePrice, costPrice, minStockLevel, description, storeId } = body;

    const product = await prisma.product.create({
      data: {
        tenantId: (session?.user as any).tenantId,
        name,
        categoryId: categoryId || null,
        unitId: unitId || null,
        sku: sku || null,
        barcode: barcode || null,
        retailPrice: parseFloat(retailPrice),
        wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        minStockLevel: parseInt(minStockLevel) || 10,
        description: description || null,
      },
      include: { category: true, unit: true },
    });

    // Create inventory for all stores
    const stores = await prisma.store.findMany({ where: { tenantId: (session?.user as any).tenantId } });
    for (const store of stores) {
      await prisma.inventory.create({
        data: { productId: product.id, storeId: store.id, quantity: 0 },
      });
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") return NextResponse.json({ error: "SKU or barcode already exists" }, { status: 409 });
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
