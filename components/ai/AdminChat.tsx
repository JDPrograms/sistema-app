"use client";
import { useState, useRef, useEffect } from "react";

interface Message { role: "user" | "assistant"; content: string }
interface Action { tipo: string; datos: Record<string, unknown> }
interface Props { agentId?: string; siteSlug: string; siteName: string }

const ACTION_LABELS: Record<string, string> = {
  actualizar_info:     "Actualizar información del negocio",
  crear_servicio:      "Crear servicio",
  actualizar_servicio: "Actualizar servicio",
  crear_producto:      "Crear producto",
  actualizar_producto: "Actualizar producto",
};

function parseAction(text: string): { clean: string; action: Action | null } {
  const match = text.match(/@@ACCION@@([\s\S]*?)@@FIN@@/);
  if (!match) return { clean: text.trim(), action: null };
  try {
    const action = JSON.parse(match[1].trim()) as Action;
    const clean = text.replace(/@@ACCION@@[\s\S]*?@@FIN@@/, "").trim();
    return { clean, action };
  } catch {
    return { clean: text.trim(), action: null };
  }
}

async function executeAction(siteSlug: string, action: Action): Promise<string> {
  const { tipo, datos } = action;
  const base = `/api/site/${siteSlug}`;

  try {
    if (tipo === "actualizar_info") {
      const res = await fetch(`${base}/customize`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
      });
      return res.ok ? "Información del negocio actualizada correctamente." : "Error al actualizar la información.";
    }
    if (tipo === "crear_servicio") {
      const res = await fetch(`${base}/content`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "service", ...datos }),
      });
      return res.ok ? `Servicio "${datos.nombre}" creado correctamente.` : "Error al crear el servicio.";
    }
    if (tipo === "actualizar_servicio") {
      const { id, ...rest } = datos;
      const res = await fetch(`${base}/content/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "service", ...rest }),
      });
      return res.ok ? "Servicio actualizado correctamente." : "Error al actualizar el servicio.";
    }
    if (tipo === "crear_producto") {
      const res = await fetch(`${base}/products`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
      });
      return res.ok ? `Producto "${datos.nombre}" creado correctamente.` : "Error al crear el producto.";
    }
    if (tipo === "actualizar_producto") {
      const { id, ...rest } = datos;
      const res = await fetch(`${base}/products/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rest),
      });
      return res.ok ? "Producto actualizado correctamente." : "Error al actualizar el producto.";
    }
    return "Accion no reconocida.";
  } catch {
    return "Error de conexion al ejecutar la accion.";
  }
}

export default function AdminChat({ agentId, siteSlug, siteName }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Hola! Soy tu asistente IA para ${siteName}. Puedo ayudarte con contenido, diseño, y también puedo ejecutar cambios directamente en el sitio: crear productos, servicios, actualizar la información del negocio y más. ¿Qué necesitas?`,
      }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingAction]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setPendingAction(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, agentId, siteSlug, isAdmin: true }),
      });
      const data = await res.json();
      const raw = data.text ?? data.error ?? "Error al responder.";
      const { clean, action } = parseAction(raw);
      setMessages((prev) => [...prev, { role: "assistant", content: clean }]);
      if (action) setPendingAction(action);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexion." }]);
    }
    setLoading(false);
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setExecutingAction(true);
    const action = pendingAction;
    setPendingAction(null);
    const result = await executeAction(siteSlug, action);
    setMessages((prev) => [...prev, { role: "assistant", content: `✅ ${result}` }]);
    setExecutingAction(false);
  }

  function cancelAction() {
    setPendingAction(null);
    setMessages((prev) => [...prev, { role: "assistant", content: "Accion cancelada." }]);
  }

  const SUGGESTIONS = [
    "Agrega un producto llamado...",
    "Actualiza la descripcion del negocio",
    "Cambia el color principal a...",
    "Dame ideas para atraer mas clientes",
  ];

  return (
    <>
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: "560px" }}>
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <p className="font-semibold text-sm">Asistente IA Admin</p>
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

            {/* Pending action confirmation */}
            {pendingAction && !executingAction && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs font-bold text-blue-800 mb-1">⚡ Accion a ejecutar</p>
                <p className="text-sm text-blue-900 font-medium mb-2">
                  {ACTION_LABELS[pendingAction.tipo] || pendingAction.tipo}
                </p>
                <div className="bg-white rounded-lg border border-blue-100 p-2 mb-3 max-h-24 overflow-auto">
                  {Object.entries(pendingAction.datos).filter(([k]) => k !== "id").map(([k, v]) => (
                    <p key={k} className="text-xs text-gray-600">
                      <span className="font-medium text-gray-700">{k}:</span> {String(v)}
                    </p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={confirmAction}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                    ✓ Confirmar
                  </button>
                  <button onClick={cancelAction}
                    className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            {executingAction && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                <p className="text-xs text-blue-700 animate-pulse">Ejecutando accion...</p>
              </div>
            )}

            {messages.length === 1 && (
              <div className="space-y-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setInput(s)}
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

          <div className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Pregunta o pide un cambio..."
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
