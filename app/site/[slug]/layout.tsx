import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site || !site.isActive) notFound();
  return <>{children}</>;
}
