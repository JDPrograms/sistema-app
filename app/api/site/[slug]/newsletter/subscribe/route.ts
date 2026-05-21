import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const ip = getClientIp(req);
  if (!rateLimit(`newsletter:${ip}`, 3, 60_000))
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { email, name } = await req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });

  const existing = await prisma.siteNewsletterSubscriber.findUnique({
    where: { email_siteId: { email, siteId: site.id } },
  });
  if (existing) {
    if (existing.isActive) return NextResponse.json({ ok: true, already: true });
    await prisma.siteNewsletterSubscriber.update({ where: { id: existing.id }, data: { isActive: true } });
    return NextResponse.json({ ok: true });
  }

  await prisma.siteNewsletterSubscriber.create({
    data: { siteId: site.id, email, name, source: "form", confirmedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
