"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function NewBlogPostPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSave(publish = false) {
    if (!title) return;
    setSaving(true);
    const res = await fetch(`/api/site/${slug}/blog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, excerpt, content, imageUrl, category, authorName, isPublished: publish }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      router.replace(`/site/${slug}/admin/blog/${d.post.id}`);
    } else {
      setMsg("Error al guardar");
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/site/${slug}/admin/blog`} className="text-sm text-gray-400 hover:text-gray-600">← Volver</Link>
        <h1 className="text-xl font-bold text-gray-900">Nuevo artículo</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL imagen destacada</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resumen</label>
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="<h2>Sección</h2><p>Contenido...</p>" />
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          {msg && <span className="text-sm text-red-600">{msg}</span>}
          <button onClick={() => handleSave(false)} disabled={saving || !title}
            className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Guardar borrador
          </button>
          <button onClick={() => handleSave(true)} disabled={saving || !title}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium">
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
