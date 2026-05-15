import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const ads = await prisma.siteAd.findMany({
    where: { siteId: site.id },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(ads);
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!canManage(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json();
  const { title, description, imageUrl, linkUrl, buttonText, type, order } = body;
  if (!title) return NextResponse.json({ error: "El titulo es requerido" }, { status: 400 });

  const ad = await prisma.siteAd.create({
    data: {
      siteId: site.id,
      title,
      description: description || null,
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || null,
      buttonText: buttonText || null,
      type: type || "banner",
      order: order ?? 0,
    },
  });
  return NextResponse.json(ad, { status: 201 });
}
