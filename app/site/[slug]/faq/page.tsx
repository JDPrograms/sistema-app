import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function FaqPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, name: true, primaryColor: true } });
  if (!site) notFound();

  const faqs = await prisma.siteFaq.findMany({
    where: { siteId: site.id, isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))] as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href={`/site/${slug}`} className="text-sm text-gray-400 hover:text-gray-600">← Volver</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-3">Preguntas frecuentes</h1>
        </div>

        {faqs.length === 0 ? (
          <p className="text-gray-400 text-center py-16">No hay preguntas disponibles.</p>
        ) : categories.length > 0 ? (
          categories.map((cat) => (
            <div key={cat} className="mb-8">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">{cat}</h2>
              <FaqList faqs={faqs.filter((f) => f.category === cat)} primaryColor={site.primaryColor} />
            </div>
          ))
        ) : (
          <FaqList faqs={faqs} primaryColor={site.primaryColor} />
        )}
      </div>
    </div>
  );
}

function FaqList({ faqs, primaryColor }: { faqs: any[]; primaryColor: string | null }) {
  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <details key={faq.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden group">
          <summary className="px-5 py-4 font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
            {faq.question}
            <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="px-5 pb-4 text-gray-600 text-sm">{faq.answer}</div>
        </details>
      ))}
    </div>
  );
}
