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

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (email) {
    const loyalty = await prisma.siteLoyaltyPoint.findUnique({
      where: { siteId_clientEmail: { siteId: site.id, clientEmail: email } },
      include: { logs: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    return NextResponse.json({ loyalty });
  }

  const all = await prisma.siteLoyaltyPoint.findMany({
    where: { siteId: site.id },
    orderBy: { points: "desc" },
  });
  return NextResponse.json({ loyalty: all });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clientEmail, clientName, points, type, reason } = await req.json();
  if (!clientEmail || !points || !type) return NextResponse.json({ error: "Datos requeridos" }, { status: 400 });

  const existing = await prisma.siteLoyaltyPoint.findUnique({
    where: { siteId_clientEmail: { siteId: site.id, clientEmail } },
  });

  const delta = type === "spend" ? -Math.abs(points) : Math.abs(points);

  if (existing) {
    const newPoints = existing.points + delta;
    if (newPoints < 0) return NextResponse.json({ error: "Puntos insuficientes" }, { status: 400 });

    const [loyalty] = await prisma.$transaction([
      prisma.siteLoyaltyPoint.update({
        where: { id: existing.id },
        data: {
          points: newPoints,
          totalEarned: type === "earn" ? { increment: points } : undefined,
          totalSpent: type === "spend" ? { increment: Math.abs(points) } : undefined,
        },
      }),
      prisma.siteLoyaltyLog.create({
        data: { loyaltyId: existing.id, points: delta, type, reason },
      }),
    ]);
    return NextResponse.json({ loyalty });
  }

  if (delta < 0) return NextResponse.json({ error: "Puntos insuficientes" }, { status: 400 });

  const loyalty = await prisma.siteLoyaltyPoint.create({
    data: {
      siteId: site.id, clientEmail, clientName: clientName || clientEmail,
      points: delta, totalEarned: delta > 0 ? delta : 0,
      logs: { create: { points: delta, type, reason } },
    },
  });
  return NextResponse.json({ loyalty });
}
