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
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const session = await auth();
  const site = await (all ? checkAdmin(slug, session) : prisma.site.findUnique({ where: { slug }, select: { id: true } }));
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const reviews = await prisma.siteReview.findMany({
    where: { siteId: site.id, ...(all ? {} : { isApproved: true, isPublic: true }) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const ip = getClientIp(req);
  if (!rateLimit(`review:${ip}`, 3, 60_000))
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { clientName, clientEmail, rating, comment, serviceName } = await req.json();
  if (!clientName || !rating) return NextResponse.json({ error: "Nombre y calificación requeridos" }, { status: 400 });
  if (rating < 1 || rating > 5) return NextResponse.json({ error: "Calificación debe ser 1-5" }, { status: 400 });

  const review = await prisma.siteReview.create({
    data: { siteId: site.id, clientName, clientEmail, rating, comment, serviceName, isApproved: false },
  });
  return NextResponse.json({ review, pending: true });
}
