"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";

interface Ad {
  id: string; title: string; description?: string; imageUrl?: string;
  linkUrl?: string; buttonText?: string; type: string; isActive: boolean; order: number;
}

const typeLabels: Record<string, string> = {
  banner: "Banner principal",
  sidebar: "Barra lateral",
  popup: "Ventana emergente",
};

const emptyForm = { title: "", description: "", imageUrl: "", linkUrl: "", buttonText: "", type: "banner", order: "0" };

export default function AdsPage() {
  const { slug } = useParams() as { slug: string };
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch(`/api/site/${slug}/ads`);
    if (r.ok) setAds(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function openEdit(ad: Ad) {
    setEditingId(ad.id);
    setForm({
      title: ad.title, description: ad.description || "",
      imageUrl: ad.imageUrl || "", linkUrl: ad.linkUrl || "",
      buttonText: ad.buttonText || "", type: ad.type, order: String(ad.order),
    });
    setShowForm(true);
    setError("");
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const body = {
      title: form.title, description: form.description || null,
      imageUrl: form.imageUrl || null, linkUrl: form.linkUrl || null,
      buttonText: form.buttonText || null, type: form.type,
      order: parseInt(form.order) || 0,
    };
    let r: Response;
    if (editingId) {
      r = await fetch(`/api/site/${slug}/ads/${editingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    } else {
      r = await fetch(`/api/site/${slug}/ads`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    }
    const data = await r.json();
    setSaving(false);
    if (r.ok) {
      await load();
      setShowForm(false);
    } else {
      setError(data.error || "Error al guardar");
    }
  }

  async function toggleActive(ad: Ad) {
    await fetch(`/api/site/${slug}/ads/${ad.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ad, isActive: !ad.isActive }),
    });
    setAds((p) => p.map((a) => a.id === ad.id ? { ...a, isActive: !a.isActive } : a));
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar esta publicidad?")) return;
    await fetch(`/api/site/${slug}/ads/${id}`, { method: "DELETE" });
    setAds((p) => p.filter((a) => a.id !== id));
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publicidades</h1>
          <p className="text-gray-500 mt-1">Banners y anuncios que se muestran en tu sitio</p>
        </div>
        <button onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors">
          + Nueva publicidad
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-5">
          <h2 className="font-semibold text-gray-900">{editingId ? "Editar publicidad" : "Nueva publicidad"}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
              <input name="title" value={form.title} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Gran promocion de verano" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={2}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Texto que aparece debajo del titulo..." />
            </div>

            <div className="col-span-2">
              <ImageUpload
                label="Imagen del anuncio"
                value={form.imageUrl}
                onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
                slug={slug}
                previewHeight="h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enlace (URL)</label>
              <input name="linkUrl" value={form.linkUrl} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texto del boton</label>
              <input name="buttonText" value={form.buttonText} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ver mas, Comprar ahora..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="banner">Banner principal</option>
                <option value="sidebar">Barra lateral</option>
                <option value="popup">Ventana emergente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden (menor = primero)</label>
              <input type="number" name="order" value={form.order} onChange={handleChange} min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear publicidad"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-400">Cargando...</div>
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-3xl mb-3">📢</p>
          <p className="text-gray-500 font-medium">No hay publicidades creadas</p>
          <p className="text-gray-400 text-sm mt-1">Crea banners y anuncios para mostrar en tu sitio</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div key={ad.id} className={`bg-white rounded-xl border p-5 flex gap-4 items-start transition-opacity ${!ad.isActive ? "opacity-60" : "border-gray-200"}`}>
              {ad.imageUrl && (
                <img src={ad.imageUrl} alt={ad.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                  onError={(e) => (e.currentTarget.style.display = "none")} />
              )}
              {!ad.imageUrl && (
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">📢</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-900">{ad.title}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{typeLabels[ad.type] || ad.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ad.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {ad.isActive ? "Activa" : "Inactiva"}
                  </span>
                </div>
                {ad.description && <p className="text-sm text-gray-500">{ad.description}</p>}
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  {ad.linkUrl && <span>Enlace: {ad.linkUrl}</span>}
                  {ad.buttonText && <span>Boton: "{ad.buttonText}"</span>}
                  <span>Orden: {ad.order}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(ad)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ad.isActive ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                  {ad.isActive ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => openEdit(ad)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                  Editar
                </button>
                <button onClick={() => handleDelete(ad.id)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
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
