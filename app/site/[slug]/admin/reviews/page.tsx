"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Review { id: string; clientName: string; clientEmail?: string; rating: number; comment?: string; serviceName?: string; isApproved: boolean; isPublic: boolean; createdAt: string }

export default function ReviewsPage() {
  const { slug } = useParams() as { slug: string };
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/reviews?all=true`);
    if (res.ok) { const d = await res.json(); setReviews(d.reviews); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  async function handleApprove(id: string, isApproved: boolean) {
    await fetch(`/api/site/${slug}/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar reseña?")) return;
    await fetch(`/api/site/${slug}/reviews/${id}`, { method: "DELETE" });
    load();
  }

  const pending = reviews.filter((r) => !r.isApproved);
  const approved = reviews.filter((r) => r.isApproved);

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reseñas de clientes</h1>

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Pendientes de aprobación ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-500 text-lg">{stars(r.rating)}</span>
                    <span className="text-sm font-semibold text-gray-900">{r.clientName}</span>
                    {r.serviceName && <span className="text-xs text-gray-400">{r.serviceName}</span>}
                  </div>
                  {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString("es")}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleApprove(r.id, true)} className="text-xs px-3 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50">Aprobar</button>
                  <button onClick={() => handleDelete(r.id)} className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Aprobadas ({approved.length})</h2>
        {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (
          <div className="space-y-3">
            {approved.length === 0 && <p className="text-sm text-gray-400">No hay reseñas aprobadas.</p>}
            {approved.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-500 text-lg">{stars(r.rating)}</span>
                    <span className="text-sm font-semibold text-gray-900">{r.clientName}</span>
                    {r.serviceName && <span className="text-xs text-gray-400">{r.serviceName}</span>}
                  </div>
                  {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString("es")}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleApprove(r.id, false)} className="text-xs text-gray-500 hover:underline">Ocultar</button>
                  <button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
