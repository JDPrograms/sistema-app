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

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; postId: string }> }) {
  const { slug, postId } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const post = await prisma.siteBlogPost.findFirst({ where: { id: postId, siteId: site.id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string; postId: string }> }) {
  const { slug, postId } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { isPublished, ...rest } = await req.json();
  const updateData: any = { ...rest };
  if (isPublished !== undefined) {
    updateData.isPublished = isPublished;
    if (isPublished && !rest.publishedAt) updateData.publishedAt = new Date();
  }
  const post = await prisma.siteBlogPost.update({ where: { id: postId }, data: updateData });
  return NextResponse.json({ post });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string; postId: string }> }) {
  const { slug, postId } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.siteBlogPost.delete({ where: { id: postId } });
  return NextResponse.json({ ok: true });
}
