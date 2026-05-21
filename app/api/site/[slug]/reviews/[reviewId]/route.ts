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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string; reviewId: string }> }) {
  const { slug, reviewId } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();
  const review = await prisma.siteReview.update({ where: { id: reviewId }, data });
  return NextResponse.json({ review });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string; reviewId: string }> }) {
  const { slug, reviewId } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.siteReview.delete({ where: { id: reviewId } });
  return NextResponse.json({ ok: true });
}
