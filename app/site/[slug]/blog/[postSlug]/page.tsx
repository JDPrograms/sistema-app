import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string; postSlug: string }> }) {
  const { slug, postSlug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, name: true, primaryColor: true } });
  if (!site) notFound();

  const post = await prisma.siteBlogPost.findFirst({
    where: { siteId: site.id, slug: postSlug, isPublished: true },
  });
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-white">
      {post.imageUrl && (
        <div className="w-full h-64 md:h-80 overflow-hidden">
          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href={`/site/${slug}/blog`} className="text-sm text-gray-400 hover:text-gray-600">← Blog</Link>
        {post.category && <p className="text-sm text-blue-600 font-medium mt-4">{post.category}</p>}
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 border-b border-gray-100 pb-4">
          {post.authorName && <span>Por {post.authorName}</span>}
          {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}</span>}
        </div>
        {post.excerpt && <p className="text-lg text-gray-500 italic mb-6">{post.excerpt}</p>}
        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </div>
  );
}
