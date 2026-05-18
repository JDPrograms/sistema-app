import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!canManage(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const logs = await prisma.siteInventoryLog.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(logs);
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!canManage(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();

  const product = await prisma.siteProduct.findUnique({ where: { id: body.productId } });
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  const previousStock = product.stock;
  let newStock: number | null = null;

  if (body.type === "in") {
    newStock = (previousStock ?? 0) + Number(body.quantity);
  } else if (body.type === "out") {
    newStock = Math.max(0, (previousStock ?? 0) - Number(body.quantity));
  } else if (body.type === "adjustment") {
    newStock = Number(body.quantity);
  }

  await prisma.siteProduct.update({
    where: { id: product.id },
    data: { stock: newStock },
  });

  const log = await prisma.siteInventoryLog.create({
    data: {
      siteId: site.id,
      productId: product.id,
      productName: product.name,
      type: body.type,
      quantity: Number(body.quantity),
      previousStock,
      newStock,
      reason: body.reason || null,
    },
  });
  return NextResponse.json(log, { status: 201 });
}
