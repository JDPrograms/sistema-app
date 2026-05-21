import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReviewsSection from "@/components/site/ReviewsSection";

export default async function ReviewsPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, name: true, primaryColor: true } });
  if (!site) notFound();

  const reviews = await prisma.siteReview.findMany({
    where: { siteId: site.id, isApproved: true, isPublic: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, clientName: true, rating: true, comment: true, serviceName: true, createdAt: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href={`/site/${slug}`} className="text-sm text-gray-400 hover:text-gray-600">← Volver</Link>
      </div>
      <ReviewsSection reviews={reviews as any} slug={slug} primaryColor={site.primaryColor ?? undefined} />
    </div>
  );
}
