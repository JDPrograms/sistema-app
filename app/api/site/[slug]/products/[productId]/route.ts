import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; productId: string }> }
) {
  const session = await auth();
  const { slug, productId } = await params;
  if (!canManage(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const product = await prisma.siteProduct.update({
    where: { id: productId },
    data: {
      name: body.name,
      description: body.description ?? null,
      price: body.price != null ? Number(body.price) : null,
      comparePrice: body.comparePrice != null ? Number(body.comparePrice) : null,
      stock: body.stock != null ? Number(body.stock) : null,
      lowStockAlert: body.lowStockAlert != null ? Number(body.lowStockAlert) : null,
      sku: body.sku ?? null,
      category: body.category ?? null,
      imageUrl: body.imageUrl ?? null,
      featured: body.featured ?? false,
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ slug: string; productId: string }> }
) {
  const session = await auth();
  const { slug, productId } = await params;
  if (!canManage(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await prisma.siteProduct.delete({ where: { id: productId } });
  return NextResponse.json({ ok: true });
}
