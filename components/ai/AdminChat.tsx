"use client";
import { useState, useRef, useEffect } from "react";

interface Message { role: "user" | "assistant"; content: string }
interface Props { agentId?: string; siteSlug: string; siteName: string }

export default function AdminChat({ agentId, siteSlug, siteName }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Hola! Soy tu asistente IA para gestionar ${siteName}. Puedo ayudarte con ideas de contenido, diseño, textos para servicios, estrategias de publicidad, y cualquier duda sobre el panel de administracion. ¿Que necesitas?`,
      }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, agentId, siteSlug, isAdmin: true }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.text ?? data.error ?? "Error al responder.",
      }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexion." }]);
    }
    setLoading(false);
  }

  const SUGGESTIONS = [
    "Dame ideas para describir mis servicios",
    "Que colores me recomiendas para mi negocio?",
    "Como puedo atraer mas clientes?",
    "Ayudame a escribir una descripcion del negocio",
  ];

  return (
    <>
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: "520px" }}>
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <p className="font-semibold text-sm">Asistente IA</p>
                <p className="text-xs text-slate-400">{siteName}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user" ? "bg-slate-800 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="space-y-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => { setInput(s); }}
                    className="w-full text-left text-xs px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm text-sm text-gray-500 animate-pulse">Pensando...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Pregunta algo..."
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-xl bg-slate-800 text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-colors">
              →
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((p) => !p)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium transition-all ${
          open ? "bg-slate-700 text-white" : "bg-slate-800 text-white hover:bg-slate-700"
        }`}
      >
        <span>🤖</span> Asistente IA
      </button>
    </>
  );
}
