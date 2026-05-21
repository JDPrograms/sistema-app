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
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const faqs = await prisma.siteFaq.findMany({
    where: { siteId: site.id, isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ faqs });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { question, answer, category, order } = await req.json();
  if (!question || !answer) return NextResponse.json({ error: "Pregunta y respuesta requeridas" }, { status: 400 });

  const faq = await prisma.siteFaq.create({
    data: { siteId: site.id, question, answer, category, order: order ?? 0 },
  });
  return NextResponse.json({ faq });
}
