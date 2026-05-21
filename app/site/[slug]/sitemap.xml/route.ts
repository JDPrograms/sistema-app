import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;

  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, modules: true, updatedAt: true },
  });

  if (!site) return new Response("Not found", { status: 404 });

  const mods = (() => { try { return JSON.parse(site.modules); } catch { return {}; } })();
  const siteBase = `${base}/site/${slug}`;

  const urls: { loc: string; priority: string }[] = [
    { loc: siteBase, priority: "1.0" },
  ];

  if (mods.blog) {
    const posts = await prisma.siteBlogPost.findMany({ where: { siteId: site.id, isPublished: true }, select: { slug: true } });
    urls.push({ loc: `${siteBase}/blog`, priority: "0.8" });
    posts.forEach((p) => urls.push({ loc: `${siteBase}/blog/${p.slug}`, priority: "0.7" }));
  }
  if (mods.gallery) urls.push({ loc: `${siteBase}/gallery`, priority: "0.6" });
  if (mods.faq) urls.push({ loc: `${siteBase}/faq`, priority: "0.6" });
  if (mods.reviews) urls.push({ loc: `${siteBase}/reviews`, priority: "0.6" });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
