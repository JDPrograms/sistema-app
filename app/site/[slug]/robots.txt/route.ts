import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;

  const site = await prisma.site.findUnique({ where: { slug }, select: { isActive: true } });
  if (!site || !site.isActive) {
    return new Response("User-agent: *\nDisallow: /", { headers: { "Content-Type": "text/plain" } });
  }

  const txt = `User-agent: *
Allow: /site/${slug}
Disallow: /site/${slug}/admin
Disallow: /site/${slug}/portal
Disallow: /site/${slug}/login

Sitemap: ${base}/site/${slug}/sitemap.xml`;

  return new Response(txt, { headers: { "Content-Type": "text/plain" } });
}
