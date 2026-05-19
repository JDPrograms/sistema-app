import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

function parseMods(s: string): Record<string, boolean> {
  try { return JSON.parse(s); } catch { return {}; }
}

const getSite = cache(async (slug: string) => {
  return prisma.site.findUnique({ where: { slug } });
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite(slug);
  const mods = parseMods(site?.modules ?? "{}");
  if (!site || mods.pwa !== true) return {};

  return {
    manifest: `/site/${slug}/manifest.json`,
    themeColor: site.primaryColor || "#3b82f6",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: site.pwaShortName || site.name,
    },
    other: {
      "mobile-web-app-capable": "yes",
    },
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSite(slug);
  if (!site || !site.isActive) notFound();
  const mods = parseMods(site.modules ?? "{}");
  return (
    <>
      {children}
      {mods.pwa === true && <PwaInstallPrompt siteName={site.pwaShortName || site.name} />}
    </>
  );
}
