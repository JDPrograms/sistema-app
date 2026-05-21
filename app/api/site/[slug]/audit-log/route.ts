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
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 200);
  const page = Number(searchParams.get("page") || "1");

  const [logs, total] = await prisma.$transaction([
    prisma.siteAuditLog.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.siteAuditLog.count({ where: { siteId: site.id } }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, entityType, entityId, details } = await req.json();
  const user = session?.user as any;

  const log = await prisma.siteAuditLog.create({
    data: {
      siteId: site.id, action, entityType, entityId,
      details: details ? JSON.stringify(details) : null,
      actorId: user?.id, actorName: user?.name, actorRole: user?.role,
    },
  });
  return NextResponse.json({ log });
}
