import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function BlogListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, name: true, primaryColor: true } });
  if (!site) notFound();

  const posts = await prisma.siteBlogPost.findMany({
    where: { siteId: site.id, isPublished: true },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true, excerpt: true, imageUrl: true, category: true, publishedAt: true, authorName: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href={`/site/${slug}`} className="text-sm text-gray-400 hover:text-gray-600">← Volver al inicio</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-3">Blog</h1>
        </div>

        {posts.length === 0 ? (
          <p className="text-gray-400 text-center py-16">No hay artículos publicados aún.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/site/${slug}/blog/${post.slug}`}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover" />}
                <div className="p-5">
                  {post.category && <span className="text-xs text-blue-600 font-medium">{post.category}</span>}
                  <h2 className="text-lg font-bold text-gray-900 mt-1 mb-2">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>}
                  <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                    {post.authorName && <span>{post.authorName}</span>}
                    {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
