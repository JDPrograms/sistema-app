import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  const isAdmin = role === "superadmin" || (role === "siteadmin" && (session?.user as any)?.siteSlug === slug);
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });
  const products = await prisma.siteProduct.findMany({
    where: { siteId: site.id, ...(isAdmin ? {} : { isActive: true }) },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (role === "siteadmin" && (session.user as any).siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });
  const body = await req.json();
  const product = await prisma.siteProduct.create({
    data: { ...body, siteId: site.id },
  });
  return NextResponse.json(product, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { productId } = await req.json();
  await prisma.siteProduct.delete({ where: { id: productId } });
  return NextResponse.json({ ok: true });
}
