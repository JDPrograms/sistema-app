import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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

  const items = await prisma.siteWaitingList.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const ip = getClientIp(req);
  if (!rateLimit(`waiting-list:${ip}`, 3, 60_000))
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { clientName, clientEmail, clientPhone, serviceId, serviceName, staffId, staffName, preferredDate, preferredTime, notes } = await req.json();
  if (!clientName || !clientEmail) return NextResponse.json({ error: "Nombre y email requeridos" }, { status: 400 });

  const item = await prisma.siteWaitingList.create({
    data: { siteId: site.id, clientName, clientEmail, clientPhone, serviceId, serviceName, staffId, staffName, preferredDate, preferredTime, notes },
  });
  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status } = await req.json();
  const item = await prisma.siteWaitingList.update({ where: { id }, data: { status } });
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await prisma.siteWaitingList.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
