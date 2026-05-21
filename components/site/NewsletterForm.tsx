"use client";
import { useState } from "react";

export default function NewsletterForm({ slug, primaryColor }: { slug: string; primaryColor?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/site/${slug}/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMsg({ type: "ok", text: data.already ? "Ya estás suscrito." : "¡Te suscribiste correctamente!" });
      setEmail("");
      setName("");
    } else {
      setMsg({ type: "err", text: data.error || "Error al suscribirse" });
    }
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Suscríbete a nuestro newsletter</h2>
        <p className="text-gray-500 mb-6">Recibe noticias, ofertas y novedades directamente en tu correo.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre (opcional)"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 text-sm"
            style={{ "--tw-ring-color": primaryColor } as any}
          />
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder="tu@correo.com"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 text-sm"
          />
          {msg && (
            <div className={`py-2 text-sm rounded-lg ${msg.type === "ok" ? "text-green-700" : "text-red-600"}`}>
              {msg.text}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-opacity text-sm"
            style={{ backgroundColor: primaryColor || "#3b82f6" }}>
            {loading ? "Suscribiendo..." : "Suscribirme"}
          </button>
        </form>
      </div>
    </section>
  );
}
