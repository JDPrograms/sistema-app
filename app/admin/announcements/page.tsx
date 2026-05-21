"use client";
import { useState, useEffect } from "react";

interface Announcement { id: string; title: string; body: string; type: string; targetAll: boolean; isActive: boolean; expiresAt?: string; createdAt: string; createdBy?: string }

const typeColors: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  success: "bg-green-100 text-green-700",
  maintenance: "bg-purple-100 text-purple-700",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", body: "", type: "info", targetAll: true, expiresAt: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/announcements");
    if (res.ok) { const d = await res.json(); setAnnouncements(d.announcements); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, expiresAt: form.expiresAt || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setMsg("Anuncio enviado a todos los sitios"); setForm({ title: "", body: "", type: "info", targetAll: true, expiresAt: "" }); load(); }
    else setMsg(data.error || "Error");
    setTimeout(() => setMsg(""), 4000);
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch("/api/admin/announcements", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: !isActive }) });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar anuncio?")) return;
    await fetch("/api/admin/announcements", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Anuncios a sitios</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Enviar anuncio</h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="info">Información</option>
                <option value="warning">Advertencia</option>
                <option value="success">Éxito</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expira el (opcional)</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-sm text-green-600">{msg}</span>}
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {saving ? "Enviando..." : "Enviar a todos los sitios"}
            </button>
          </div>
        </form>
      </div>

      {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (
        <div className="space-y-3">
          {announcements.length === 0 && <p className="text-sm text-gray-400">No hay anuncios.</p>}
          {announcements.map((a) => (
            <div key={a.id} className={`rounded-xl border p-4 ${a.isActive ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[a.type] || "bg-gray-100 text-gray-600"}`}>{a.type}</span>
                    {!a.isActive && <span className="text-xs text-gray-400">Inactivo</span>}
                  </div>
                  <p className="font-semibold text-gray-900">{a.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{a.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {a.createdBy && `Por ${a.createdBy} · `}
                    {new Date(a.createdAt).toLocaleDateString("es")}
                    {a.expiresAt && ` · Expira ${new Date(a.expiresAt).toLocaleDateString("es")}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(a.id, a.isActive)} className="text-xs text-blue-600 hover:underline">
                    {a.isActive ? "Ocultar" : "Activar"}
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
