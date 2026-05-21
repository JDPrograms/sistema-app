import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function checkAdmin(slug: string, session: any) {
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return null;
  const role = session?.user?.role;
  if (role === "superadmin") return site;
  if (role === "siteadmin" && session.user.siteSlug === slug) return site;
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const coupons = await prisma.siteCoupon.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code, description, discountType, discountValue, minOrderValue, maxUses, expiresAt } = await req.json();
  if (!code || !discountValue) return NextResponse.json({ error: "Código y valor requeridos" }, { status: 400 });

  const existing = await prisma.siteCoupon.findUnique({ where: { siteId_code: { siteId: site.id, code: code.toUpperCase() } } });
  if (existing) return NextResponse.json({ error: "El código ya existe" }, { status: 409 });

  const coupon = await prisma.siteCoupon.create({
    data: {
      siteId: site.id, code: code.toUpperCase(), description,
      discountType: discountType || "percent", discountValue, minOrderValue, maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
  return NextResponse.json({ coupon });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, ...data } = await req.json();
  const coupon = await prisma.siteCoupon.update({ where: { id }, data });
  return NextResponse.json({ coupon });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await prisma.siteCoupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
