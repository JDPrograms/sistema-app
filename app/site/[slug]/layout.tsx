import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

const getSite = cache(async (slug: string) => {
  return prisma.site.findUnique({ where: { slug } });
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite(slug);
  if (!site?.pwaEnabled) return {};

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
  return (
    <>
      {children}
      {site.pwaEnabled && <PwaInstallPrompt siteName={site.pwaShortName || site.name} />}
    </>
  );
}
