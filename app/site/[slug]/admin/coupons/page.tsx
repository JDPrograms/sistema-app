"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Coupon { id: string; code: string; description?: string; discountType: string; discountValue: number; minOrderValue?: number; maxUses?: number; usedCount: number; isActive: boolean; expiresAt?: string }

export default function CouponsPage() {
  const { slug } = useParams() as { slug: string };
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", description: "", discountType: "percent", discountValue: "", minOrderValue: "", maxUses: "", expiresAt: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/coupons`);
    if (res.ok) { const d = await res.json(); setCoupons(d.coupons); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/site/${slug}/coupons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, discountValue: Number(form.discountValue), minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : undefined, maxUses: form.maxUses ? Number(form.maxUses) : undefined }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setMsg("Cupón creado"); setForm({ code: "", description: "", discountType: "percent", discountValue: "", minOrderValue: "", maxUses: "", expiresAt: "" }); load(); }
    else setMsg(data.error || "Error");
    setTimeout(() => setMsg(""), 3000);
  }

  async function toggleActive(coupon: Coupon) {
    await fetch(`/api/site/${slug}/coupons`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }) });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar cupón?")) return;
    await fetch(`/api/site/${slug}/coupons`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cupones y descuentos</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Crear cupón</h2>
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="PROMO20"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de descuento</label>
            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="percent">Porcentaje (%)</option>
              <option value="fixed">Fijo ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orden mínima</label>
            <input type="number" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Opcional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usos máximos</label>
            <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sin límite" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vence el</label>
            <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-end gap-3">
            {msg && <span className="text-sm text-green-600">{msg}</span>}
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {saving ? "Creando..." : "Crear cupón"}
            </button>
          </div>
        </form>
      </div>

      {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (
        <div className="space-y-3">
          {coupons.length === 0 && <p className="text-sm text-gray-400">No hay cupones aún.</p>}
          {coupons.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="bg-gray-50 rounded-lg px-3 py-2 font-mono font-bold text-gray-900 text-sm">{c.code}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {c.discountType === "percent" ? `${c.discountValue}% de descuento` : `$${c.discountValue} de descuento`}
                  {c.minOrderValue ? ` (mín. $${c.minOrderValue})` : ""}
                </p>
                {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                <p className="text-xs text-gray-400 mt-0.5">
                  Usado {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : ""} veces
                  {c.expiresAt ? ` · Vence ${new Date(c.expiresAt).toLocaleDateString("es")}` : ""}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {c.isActive ? "Activo" : "Inactivo"}
              </span>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(c)} className="text-xs text-blue-600 hover:underline">{c.isActive ? "Desactivar" : "Activar"}</button>
                <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
