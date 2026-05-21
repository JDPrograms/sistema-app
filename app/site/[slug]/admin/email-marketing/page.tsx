"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function EmailMarketingPage() {
  const { slug } = useParams() as { slug: string };
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [targetType, setTargetType] = useState<"newsletter" | "users">("newsletter");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`¿Enviar este correo a todos los suscriptores de ${targetType === "newsletter" ? "newsletter" : "usuarios"}?`)) return;
    setSending(true);
    setMsg(null);
    const res = await fetch(`/api/site/${slug}/email-marketing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, html, targetType }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) setMsg({ type: "ok", text: `Enviado a ${data.sent} destinatarios` });
    else setMsg({ type: "err", text: data.error || "Error al enviar" });
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/site/${slug}/admin/newsletter`} className="text-sm text-gray-400 hover:text-gray-600">← Newsletter</Link>
        <h1 className="text-xl font-bold text-gray-900">Enviar campaña de email</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinatarios</label>
            <div className="flex gap-3">
              {[{ val: "newsletter", label: "Suscriptores de newsletter" }, { val: "users", label: "Todos los usuarios del sitio" }].map((opt) => (
                <button key={opt.val} type="button"
                  onClick={() => setTargetType(opt.val as any)}
                  className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${targetType === opt.val ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido HTML</label>
            <textarea value={html} onChange={(e) => setHtml(e.target.value)} required rows={10}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="<h1>Hola!</h1><p>Tu mensaje aquí...</p>" />
          </div>

          {msg && (
            <div className={`px-4 py-3 rounded-lg text-sm border ${msg.type === "ok" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              {msg.text}
            </div>
          )}

          <button type="submit" disabled={sending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            {sending ? "Enviando..." : "Enviar campaña"}
          </button>
        </form>
      </div>

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Nota:</strong> Asegúrate de tener configurado el email en la sección de personalización. El envío masivo puede tomar unos minutos.
      </div>
    </div>
  );
}
