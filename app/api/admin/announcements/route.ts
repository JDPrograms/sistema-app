import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function checkSuperAdmin(session: any) {
  return (session?.user as any)?.role === "superadmin";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!await checkSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const announcements = await prisma.siteAnnouncement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!await checkSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, body, type, targetAll, targetSites, expiresAt } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "Título y cuerpo requeridos" }, { status: 400 });

  const announcement = await prisma.siteAnnouncement.create({
    data: {
      title, body, type: type || "info",
      targetAll: targetAll !== false,
      targetSites: JSON.stringify(targetSites || []),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: (session?.user as any)?.name,
    },
  });

  // Create notifications for each targeted site
  const siteWhere = targetAll !== false ? {} : { id: { in: targetSites || [] } };
  const sites = await prisma.site.findMany({ where: siteWhere, select: { id: true } });
  if (sites.length > 0) {
    await prisma.siteNotification.createMany({
      data: sites.map((s) => ({
        siteId: s.id,
        title,
        body,
        type: type || "info",
        link: null,
      })),
    });
  }

  return NextResponse.json({ announcement });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!await checkSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, ...data } = await req.json();
  const ann = await prisma.siteAnnouncement.update({ where: { id }, data });
  return NextResponse.json({ announcement: ann });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!await checkSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await prisma.siteAnnouncement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
