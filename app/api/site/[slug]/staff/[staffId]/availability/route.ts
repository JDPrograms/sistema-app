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

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; staffId: string }> }) {
  const { slug, staffId } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const availability = await prisma.siteStaffAvailability.findMany({
    where: { siteId: site.id, staffId },
    orderBy: { dayOfWeek: "asc" },
  });
  return NextResponse.json({ availability });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string; staffId: string }> }) {
  const { slug, staffId } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slots } = await req.json() as { slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }> };
  if (!Array.isArray(slots)) return NextResponse.json({ error: "slots requeridos" }, { status: 400 });

  await prisma.$transaction(
    slots.map((s) =>
      prisma.siteStaffAvailability.upsert({
        where: { staffId_dayOfWeek: { staffId, dayOfWeek: s.dayOfWeek } },
        create: { siteId: site.id, staffId, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, isActive: s.isActive },
        update: { startTime: s.startTime, endTime: s.endTime, isActive: s.isActive },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
