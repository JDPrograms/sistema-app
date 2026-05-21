import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function GalleryPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, name: true, primaryColor: true } });
  if (!site) notFound();

  const images = await prisma.siteGalleryImage.findMany({
    where: { siteId: site.id, isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  const categories = [...new Set(images.map((i) => i.category).filter(Boolean))] as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href={`/site/${slug}`} className="text-sm text-gray-400 hover:text-gray-600">← Volver</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-3">Galería</h1>
        </div>

        {images.length === 0 ? (
          <p className="text-gray-400 text-center py-16">No hay imágenes en la galería.</p>
        ) : (
          <>
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-6">
                {categories.map((cat) => (
                  <span key={cat} className="text-sm px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-600">{cat}</span>
                ))}
              </div>
            )}
            <div className="columns-2 md:columns-3 gap-4 space-y-4">
              {images.map((img) => (
                <div key={img.id} className="break-inside-avoid">
                  <img src={img.url} alt={img.caption || ""} className="w-full rounded-2xl object-cover" />
                  {img.caption && <p className="text-xs text-gray-500 mt-1 px-1">{img.caption}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
