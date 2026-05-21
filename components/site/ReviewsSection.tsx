"use client";
import { useState } from "react";

interface Review { id: string; clientName: string; rating: number; comment?: string; serviceName?: string; createdAt: string }

export default function ReviewsSection({ reviews, slug, primaryColor }: { reviews: Review[]; slug: string; primaryColor?: string }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clientName: "", clientEmail: "", rating: 5, comment: "", serviceName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const stars = (n: number, filled?: boolean) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < n ? "text-yellow-400" : "text-gray-200"}>★</span>
    ));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch(`/api/site/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    setSubmitted(true);
    setShowForm(false);
  }

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Opiniones de clientes</h2>
            {avg && <p className="text-gray-500 text-sm mt-1">{avg} / 5 · {reviews.length} reseñas</p>}
          </div>
          <button onClick={() => setShowForm((v) => !v)}
            className="text-sm font-medium text-white px-4 py-2 rounded-xl transition-colors"
            style={{ backgroundColor: primaryColor || "#3b82f6" }}>
            {showForm ? "Cancelar" : "Dejar reseña"}
          </button>
        </div>

        {showForm && !submitted && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Tu opinión</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Tu nombre" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                <input type="email" placeholder="Email (opcional)" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Calificación:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}
                    className={`text-2xl transition-transform hover:scale-110 ${n <= form.rating ? "text-yellow-400" : "text-gray-300"}`}>★</button>
                ))}
              </div>
              <input type="text" placeholder="Servicio (opcional)" value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <textarea placeholder="Tu comentario..." value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={3}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <button type="submit" disabled={submitting}
                className="w-full text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
                style={{ backgroundColor: primaryColor || "#3b82f6" }}>
                {submitting ? "Enviando..." : "Enviar reseña"}
              </button>
            </form>
          </div>
        )}

        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-700 text-sm">
            ¡Gracias! Tu reseña fue enviada y será publicada tras aprobación.
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No hay reseñas aún. ¡Sé el primero!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-1 mb-2">{stars(r.rating)}</div>
                {r.comment && <p className="text-gray-700 text-sm mb-3">{r.comment}</p>}
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 text-sm">{r.clientName}</p>
                  {r.serviceName && <p className="text-xs text-gray-400">{r.serviceName}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
