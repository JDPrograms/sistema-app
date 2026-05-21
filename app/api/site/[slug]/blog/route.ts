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
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const posts = await prisma.siteBlogPost.findMany({
    where: { siteId: site.id, ...(all ? {} : { isPublished: true }) },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true, excerpt: true, imageUrl: true, category: true, isPublished: true, publishedAt: true, authorName: true, createdAt: true },
  });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, slug: postSlug, excerpt, content, imageUrl, category, tags, isPublished, authorName } = await req.json();
  if (!title) return NextResponse.json({ error: "Título requerido" }, { status: 400 });

  const baseSlug = (postSlug || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let finalSlug = baseSlug;
  let counter = 1;
  while (await prisma.siteBlogPost.findUnique({ where: { siteId_slug: { siteId: site.id, slug: finalSlug } } })) {
    finalSlug = `${baseSlug}-${counter++}`;
  }

  const post = await prisma.siteBlogPost.create({
    data: {
      siteId: site.id, title, slug: finalSlug, excerpt, content: content || "",
      imageUrl, category, tags: JSON.stringify(tags || []),
      isPublished: !!isPublished,
      publishedAt: isPublished ? new Date() : null,
      authorName,
    },
  });
  return NextResponse.json({ post });
}
