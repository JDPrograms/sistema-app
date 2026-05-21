import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteManageClient from "./SiteManageClient";

export default async function ManageSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await prisma.site.findUnique({
    where: { id },
    include: {
      admins: { select: { id: true, name: true, email: true, isOwner: true, permissions: true, createdAt: true } },
      _count: { select: { users: true } },
    },
  });
  if (!site) notFound();

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/sites" className="text-sm text-gray-500 hover:text-gray-700">&#8592; Volver a sitios</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{site.name}</h1>
        <p className="text-gray-400 text-sm">/site/{site.slug}</p>
      </div>
      <SiteManageClient site={site as any} />
    </div>
  );
}
