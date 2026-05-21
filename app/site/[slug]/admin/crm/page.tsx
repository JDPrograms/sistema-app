"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Note { id: string; clientEmail: string; clientName: string; note: string; adminName?: string; isPrivate: boolean; createdAt: string }

export default function CrmPage() {
  const { slug } = useParams() as { slug: string };
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ clientEmail: "", clientName: "", note: "", isPrivate: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load(email?: string) {
    setLoading(true);
    const url = `/api/site/${slug}/crm${email ? `?email=${encodeURIComponent(email)}` : ""}`;
    const res = await fetch(url);
    if (res.ok) { const d = await res.json(); setNotes(d.notes); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/site/${slug}/crm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setMsg("Nota guardada"); setForm({ ...form, note: "" }); load(form.clientEmail || undefined); }
    else setMsg("Error");
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar nota?")) return;
    await fetch(`/api/site/${slug}/crm`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  const filtered = search ? notes.filter((n) => n.clientEmail.includes(search) || n.clientName.toLowerCase().includes(search.toLowerCase())) : notes;

  // Group by client
  const grouped: Record<string, Note[]> = {};
  filtered.forEach((n) => { if (!grouped[n.clientEmail]) grouped[n.clientEmail] = []; grouped[n.clientEmail].push(n); });

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">CRM — Notas de clientes</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Agregar nota</h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email del cliente</label>
              <input type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} required rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones, preferencias, historial..." />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} className="rounded" />
              Nota privada (solo admins)
            </label>
            {msg && <span className="text-sm text-green-600">{msg}</span>}
            <button type="submit" disabled={saving}
              className="ml-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {saving ? "Guardando..." : "Guardar nota"}
            </button>
          </div>
        </form>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        placeholder="Buscar por email o nombre..." />

      {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (
        <div className="space-y-4">
          {Object.keys(grouped).length === 0 && <p className="text-sm text-gray-400">No hay notas.</p>}
          {Object.entries(grouped).map(([email, clientNotes]) => (
            <div key={email} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                  {clientNotes[0].clientName?.[0] || email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{clientNotes[0].clientName}</p>
                  <p className="text-xs text-gray-400">{email}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400">{clientNotes.length} nota{clientNotes.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {clientNotes.map((note) => (
                  <div key={note.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-1">
                      {note.isPrivate && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded mr-2">Privada</span>}
                      <p className="text-sm text-gray-700 inline">{note.note}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {note.adminName && `${note.adminName} · `}
                        {new Date(note.createdAt).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(note.id)} className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
