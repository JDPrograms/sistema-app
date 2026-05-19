import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseMods(s: string): Record<string, boolean> {
  try { return JSON.parse(s); } catch { return {}; }
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({
    where: { slug },
    select: { name: true, modules: true, pwaShortName: true, description: true, primaryColor: true, logoUrl: true },
  });

  const mods = parseMods(site?.modules ?? "{}");
  if (!site || mods.pwa !== true) {
    return NextResponse.json({ error: "PWA no disponible" }, { status: 404 });
  }

  const shortName = site.pwaShortName || site.name.substring(0, 12);
  const themeColor = site.primaryColor || "#3b82f6";

  const manifest = {
    name: site.name,
    short_name: shortName,
    description: site.description || site.name,
    start_url: `/site/${slug}`,
    scope: `/site/${slug}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: themeColor,
    lang: "es",
    categories: ["business"],
    icons: site.logoUrl
      ? [
          { src: site.logoUrl, sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: site.logoUrl, sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ]
      : [
          { src: "/file.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
