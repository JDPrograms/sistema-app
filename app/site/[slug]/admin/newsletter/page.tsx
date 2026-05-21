"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Subscriber { id: string; email: string; name?: string; isActive: boolean; source: string; createdAt: string }

export default function NewsletterPage() {
  const { slug } = useParams() as { slug: string };
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/newsletter`);
    if (res.ok) { const d = await res.json(); setSubs(d.subscribers); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar suscriptor?")) return;
    await fetch(`/api/site/${slug}/newsletter`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  const active = subs.filter((s) => s.isActive);

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-sm text-gray-400 mt-0.5">{active.length} suscriptores activos</p>
        </div>
        <Link href={`/site/${slug}/admin/email-marketing`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Enviar campaña
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <a href={`/api/site/${slug}/export?type=newsletter`}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
          Exportar CSV
        </a>
      </div>

      {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Origen</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Registro</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay suscriptores</td></tr>
              )}
              {subs.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-gray-900">{s.email}</td>
                  <td className="px-4 py-3 text-gray-600">{s.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.source}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(s.createdAt).toLocaleDateString("es")}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
