"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  id?: string; role: "user" | "bot" | "human" | "system"; content: string; createdAt?: string;
}
interface Queue { id: string; name: string; description?: string | null; }
interface Props { agentId: string; agentName: string; siteSlug: string; primaryColor: string }

export default function ChatWidget({ agentId, agentName, siteSlug, primaryColor }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"bot" | "waiting" | "human" | "resolved">("bot");
  const [requestingHuman, setRequestingHuman] = useState(false);
  const [showQueueSelect, setShowQueueSelect] = useState(false);
  const [queues, setQueues] = useState<Queue[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const storageKey = `chat_session_${siteSlug}`;

  // ── Init session ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const existing = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (existing) {
      setSessionId(existing);
      loadSession(existing);
    } else if (messages.length === 0) {
      setMessages([{ role: "bot", content: `Hola! Soy el asistente de ${agentName}. ¿En qué te puedo ayudar?` }]);
    }
    // Fetch available queues
    fetch(`/api/site/${siteSlug}/support/queues`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: Queue[]) => setQueues(data))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Poll when human or waiting ────────────────────────────────
  useEffect(() => {
    if (!sessionId || (sessionStatus !== "human" && sessionStatus !== "waiting")) return;
    const t = setInterval(() => loadSession(sessionId), 4000);
    return () => clearInterval(t);
  }, [sessionId, sessionStatus]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadSession(id: string) {
    const res = await fetch(`/api/site/${siteSlug}/support/sessions/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setSessionStatus(data.status);
    const msgs: Message[] = (data.messages || []).map((m: any) => ({
      id: m.id, role: m.role, content: m.content, createdAt: m.createdAt,
    }));
    if (msgs.length > 0) setMessages(msgs);
  }

  async function ensureSession(queueId?: string, queueName?: string): Promise<string> {
    if (sessionId) return sessionId;
    const res = await fetch(`/api/site/${siteSlug}/support/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueId: queueId || null, queueName: queueName || null }),
    });
    const data = await res.json();
    const id = data.id;
    setSessionId(id);
    if (typeof window !== "undefined") localStorage.setItem(storageKey, id);
    return id;
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    const sid = await ensureSession();
    try {
      const res = await fetch(`/api/site/${siteSlug}/support/sessions/${sid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, role: "user" }),
      });
      const data = await res.json();
      if (data.botReply) {
        setMessages((prev) => [...prev, { role: "bot", content: data.botReply.content }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "bot", content: "Error de conexion. Intenta de nuevo." }]);
    }
    setLoading(false);
  }

  async function requestHuman(queueId?: string, queueName?: string) {
    if (requestingHuman) return;
    setRequestingHuman(true);
    setShowQueueSelect(false);

    const sid = sessionId || await ensureSession(queueId, queueName);

    // Update session: set queueId + waiting status
    const body: Record<string, unknown> = { status: "waiting" };
    if (queueId) { body.queueId = queueId; body.queueName = queueName; }

    const res = await fetch(`/api/site/${siteSlug}/support/sessions/${sid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      // If auto-assigned, status is already human
      setSessionStatus(data.status);
      if (data.status === "waiting") {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: "Solicitud enviada. Un agente se unirá pronto a la conversación." },
        ]);
      }
      // Reload to get system messages
      loadSession(sid);
    }
    setRequestingHuman(false);
  }

  function handleHumanClick() {
    if (queues.length > 1) {
      setShowQueueSelect(true);
    } else if (queues.length === 1) {
      requestHuman(queues[0].id, queues[0].name);
    } else {
      requestHuman();
    }
  }

  function clearSession() {
    if (typeof window !== "undefined") localStorage.removeItem(storageKey);
    setSessionId(null);
    setMessages([{ role: "bot", content: `Hola! Soy el asistente de ${agentName}. ¿En qué te puedo ayudar?` }]);
    setSessionStatus("bot");
    setShowQueueSelect(false);
  }

  const isHumanActive = sessionStatus === "human";
  const isWaiting = sessionStatus === "waiting";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: "500px" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0" style={{ backgroundColor: primaryColor }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">
                {isHumanActive ? "👤" : "🤖"}
              </div>
              <div>
                <span className="font-semibold text-sm">{isHumanActive ? "Agente en línea" : agentName}</span>
                {isWaiting && <p className="text-xs text-white/70">Esperando agente...</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {sessionId && sessionStatus === "resolved" && (
                <button onClick={clearSession} className="text-white/70 hover:text-white text-xs">Nueva chat</button>
              )}
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xl leading-none">×</button>
            </div>
          </div>

          {/* Status bar */}
          {isHumanActive && (
            <div className="px-4 py-2 bg-green-50 border-b border-green-100 text-xs text-green-700 font-medium flex items-center gap-1.5 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Un agente está atendiendo tu consulta
            </div>
          )}
          {isWaiting && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-1.5 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Buscando un agente disponible...
            </div>
          )}

          {/* Queue selector overlay */}
          {showQueueSelect && (
            <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col justify-center px-5 rounded-2xl">
              <p className="text-sm font-bold text-gray-900 mb-1 text-center">¿Sobre qué necesitas ayuda?</p>
              <p className="text-xs text-gray-400 mb-4 text-center">Selecciona el área y te conectamos con el agente correcto</p>
              <div className="space-y-2">
                {queues.map((q) => (
                  <button key={q.id} onClick={() => requestHuman(q.id, q.name)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm">
                    <p className="font-semibold text-gray-800">{q.name}</p>
                    {q.description && <p className="text-xs text-gray-400 mt-0.5">{q.description}</p>}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowQueueSelect(false)} className="mt-3 text-xs text-gray-400 hover:text-gray-600 text-center transition-colors">
                Cancelar
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-2 relative">
            {messages.map((m, i) => (
              <div key={m.id || i} className={`flex ${m.role === "user" ? "justify-end" : m.role === "system" ? "justify-center" : "justify-start"}`}>
                {m.role === "system" ? (
                  <p className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{m.content}</p>
                ) : (
                  <div className="max-w-[80%]">
                    {m.role === "human" && <p className="text-xs text-gray-400 mb-0.5 px-1">Agente</p>}
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "text-white rounded-br-sm"
                        : m.role === "human"
                        ? "bg-blue-600 text-white rounded-bl-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`} style={m.role === "user" ? { backgroundColor: primaryColor } : {}}>
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm text-sm text-gray-500">
                  <span className="animate-pulse">Escribiendo...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Human request button */}
          {sessionStatus === "bot" && sessionId && (
            <div className="px-4 py-2 border-t border-gray-100 flex-shrink-0">
              <button onClick={handleHumanClick} disabled={requestingHuman}
                className="w-full text-xs text-gray-500 hover:text-gray-700 py-1.5 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors disabled:opacity-50">
                👤 Hablar con una persona
              </button>
            </div>
          )}

          {/* Input */}
          {sessionStatus !== "resolved" && (
            <div className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={isWaiting ? "Puedes seguir escribiendo..." : "Escribe tu mensaje..."}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": primaryColor } as any}
                disabled={loading}
              />
              <button onClick={send} disabled={loading || !input.trim()}
                className="px-3 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: primaryColor }}>
                →
              </button>
            </div>
          )}
          {sessionStatus === "resolved" && (
            <div className="p-3 border-t border-gray-100 text-center flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2">Esta conversacion ha finalizado.</p>
              <button onClick={clearSession} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Iniciar nueva conversacion</button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((p) => !p)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform hover:scale-110 relative"
        style={{ backgroundColor: primaryColor }}
      >
        {open ? "×" : "💬"}
        {isWaiting && !open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  );
}
