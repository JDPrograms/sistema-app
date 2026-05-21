"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface LoyaltyEntry { id: string; clientEmail: string; clientName: string; points: number; totalEarned: number; totalSpent: number }

export default function LoyaltyPage() {
  const { slug } = useParams() as { slug: string };
  const [data, setData] = useState<LoyaltyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ clientEmail: "", clientName: "", points: "", type: "earn", reason: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/loyalty`);
    if (res.ok) { const d = await res.json(); setData(d.loyalty); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/site/${slug}/loyalty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, points: Number(form.points) }),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) { setMsg("Puntos actualizados"); setForm({ clientEmail: "", clientName: "", points: "", type: "earn", reason: "" }); load(); }
    else setMsg(d.error || "Error");
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Programa de lealtad</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Agregar / descontar puntos</h2>
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email del cliente</label>
            <input value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} required type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del cliente</label>
            <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puntos</label>
            <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} required min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="earn">Ganar puntos</option>
              <option value="spend">Canjear puntos</option>
              <option value="adjust">Ajuste manual</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Razón</label>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Compra #123, Cumpleaños..." />
          </div>
          <div className="col-span-2 flex items-center gap-3">
            {msg && <span className="text-sm text-green-600">{msg}</span>}
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {saving ? "Guardando..." : "Aplicar puntos"}
            </button>
          </div>
        </form>
      </div>

      {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Puntos</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ganados</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Canjeados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay registros</td></tr>}
              {data.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{e.clientName}</p>
                    <p className="text-xs text-gray-400">{e.clientEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-lg font-bold text-blue-600">{e.points}</span>
                  </td>
                  <td className="px-4 py-3 text-green-600">{e.totalEarned}</td>
                  <td className="px-4 py-3 text-orange-600">{e.totalSpent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
