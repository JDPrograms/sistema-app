import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { code, orderValue } = await req.json();
  if (!code) return NextResponse.json({ error: "Código requerido" }, { status: 400 });

  const coupon = await prisma.siteCoupon.findUnique({
    where: { siteId_code: { siteId: site.id, code: code.toUpperCase() } },
  });

  if (!coupon || !coupon.isActive)
    return NextResponse.json({ valid: false, error: "Cupón inválido o inactivo" });
  if (coupon.expiresAt && new Date() > coupon.expiresAt)
    return NextResponse.json({ valid: false, error: "Cupón vencido" });
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
    return NextResponse.json({ valid: false, error: "Cupón agotado" });
  if (coupon.minOrderValue && orderValue < coupon.minOrderValue)
    return NextResponse.json({ valid: false, error: `Orden mínima: $${coupon.minOrderValue}` });

  const discount = coupon.discountType === "percent"
    ? (orderValue * coupon.discountValue) / 100
    : coupon.discountValue;

  return NextResponse.json({ valid: true, coupon, discount: Math.round(discount * 100) / 100 });
}
