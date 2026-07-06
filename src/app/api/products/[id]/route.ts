import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = (session?.user as any).tenantId;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const product = await prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: true, unit: true, variants: true, inventories: { include: { store: true } } },
    });

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = (session?.user as any).tenantId;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const product = await prisma.product.updateMany({
      where: { id, tenantId },
      data: {
        name: body.name,
        categoryId: body.categoryId || null,
        unitId: body.unitId || null,
        sku: body.sku || null,
        barcode: body.barcode || null,
        retailPrice: parseFloat(body.retailPrice),
        wholesalePrice: body.wholesalePrice ? parseFloat(body.wholesalePrice) : null,
        costPrice: body.costPrice ? parseFloat(body.costPrice) : null,
        minStockLevel: parseInt(body.minStockLevel) || 10,
        description: body.description || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = (session?.user as any).tenantId;
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.product.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
