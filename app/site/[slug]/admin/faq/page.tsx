"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Faq { id: string; question: string; answer: string; category?: string; order: number; isActive: boolean }

export default function FaqPage() {
  const { slug } = useParams() as { slug: string };
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/faq`);
    if (res.ok) { const d = await res.json(); setFaqs(d.faqs); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  function startEdit(faq: Faq) {
    setEditId(faq.id); setQuestion(faq.question); setAnswer(faq.answer); setCategory(faq.category || "");
  }

  function cancelEdit() { setEditId(null); setQuestion(""); setAnswer(""); setCategory(""); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const method = editId ? "PATCH" : "POST";
    const url = editId ? `/api/site/${slug}/faq/${editId}` : `/api/site/${slug}/faq`;
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer, category }),
    });
    setSaving(false);
    if (res.ok) { cancelEdit(); load(); setMsg(editId ? "Actualizado" : "Agregado"); }
    else setMsg("Error al guardar");
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta pregunta?")) return;
    await fetch(`/api/site/${slug}/faq/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Preguntas frecuentes</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">{editId ? "Editar pregunta" : "Nueva pregunta"}</h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pregunta</label>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Respuesta</label>
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} required rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría (opcional)</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: General, Precios, Citas..." />
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-sm text-green-600">{msg}</span>}
            {editId && <button type="button" onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>}
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {saving ? "Guardando..." : editId ? "Actualizar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>

      {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (
        <div className="space-y-3">
          {faqs.length === 0 && <p className="text-sm text-gray-400">No hay preguntas aún.</p>}
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {faq.category && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">{faq.category}</span>}
                  <p className="font-medium text-gray-900 mt-1">{faq.question}</p>
                  <p className="text-sm text-gray-500 mt-1">{faq.answer}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(faq)} className="text-xs text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => handleDelete(faq.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
