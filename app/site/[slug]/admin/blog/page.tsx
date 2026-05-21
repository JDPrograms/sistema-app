"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Post { id: string; title: string; slug: string; excerpt?: string; imageUrl?: string; category?: string; isPublished: boolean; publishedAt?: string; createdAt: string }

export default function BlogPage() {
  const { slug } = useParams() as { slug: string };
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/blog?all=true`);
    if (res.ok) { const d = await res.json(); setPosts(d.posts); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este artículo?")) return;
    await fetch(`/api/site/${slug}/blog/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(post: Post) {
    await fetch(`/api/site/${slug}/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !post.isPublished }),
    });
    load();
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Blog / Noticias</h1>
        <Link href={`/site/${slug}/admin/blog/new`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nuevo artículo
        </Link>
      </div>

      {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (
        <div className="space-y-3">
          {posts.length === 0 && <p className="text-sm text-gray-400">No hay artículos aún.</p>}
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              {post.imageUrl && <img src={post.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${post.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {post.isPublished ? "Publicado" : "Borrador"}
                  </span>
                  {post.category && <span className="text-xs text-blue-600">{post.category}</span>}
                </div>
                <p className="font-medium text-gray-900 truncate">{post.title}</p>
                {post.excerpt && <p className="text-xs text-gray-500 truncate mt-0.5">{post.excerpt}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(post.createdAt).toLocaleDateString("es")}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => togglePublish(post)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-colors ${post.isPublished ? "border-gray-200 text-gray-600 hover:bg-gray-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                  {post.isPublished ? "Ocultar" : "Publicar"}
                </button>
                <Link href={`/site/${slug}/admin/blog/${post.id}`}
                  className="text-xs px-3 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
                  Editar
                </Link>
                <button onClick={() => handleDelete(post.id)}
                  className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
