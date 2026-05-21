import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canAccess(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  if (!canAccess(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  const [notifications, unreadCount] = await Promise.all([
    prisma.siteNotification.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.siteNotification.count({ where: { siteId: site.id, isRead: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  if (!canAccess(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ids } = await req.json(); // array of ids, or empty to mark all as read

  if (ids?.length) {
    await prisma.siteNotification.updateMany({
      where: { id: { in: ids }, siteId: site.id },
      data: { isRead: true },
    });
  } else {
    await prisma.siteNotification.updateMany({
      where: { siteId: site.id, isRead: false },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ ok: true });
}
