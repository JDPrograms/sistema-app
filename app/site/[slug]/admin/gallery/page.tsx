"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface GalleryImage { id: string; url: string; caption?: string; category?: string; order: number; isActive: boolean }

export default function GalleryPage() {
  const { slug } = useParams() as { slug: string };
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/gallery`);
    if (res.ok) { const d = await res.json(); setImages(d.images); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/site/${slug}/gallery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, caption, category }),
    });
    setSaving(false);
    if (res.ok) { setMsg("Imagen agregada"); setUrl(""); setCaption(""); setCategory(""); load(); }
    else setMsg("Error al agregar");
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar imagen?")) return;
    await fetch(`/api/site/${slug}/gallery`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Galería de fotos</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Agregar imagen</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de la imagen</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input value={caption} onChange={(e) => setCaption(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción opcional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Servicios" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-sm text-green-600">{msg}</span>}
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {saving ? "Agregando..." : "Agregar"}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : images.length === 0 ? (
        <p className="text-sm text-gray-400">No hay imágenes en la galería.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white">
              <img src={img.url} alt={img.caption || ""} className="w-full h-40 object-cover" />
              <div className="p-2">
                {img.caption && <p className="text-xs text-gray-600 truncate">{img.caption}</p>}
                {img.category && <p className="text-xs text-gray-400">{img.category}</p>}
              </div>
              <button onClick={() => handleDelete(img.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-lg w-7 h-7 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
