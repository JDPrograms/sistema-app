"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "bot" | "human" | "system";
  content: string;
  adminName?: string | null;
  createdAt: string;
}
interface Session {
  id: string;
  clientName: string | null;
  clientEmail: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: { content: string; role: string; createdAt: string }[];
}

const STATUS_LABEL: Record<string, string> = {
  waiting: "Esperando",
  human:   "Activo",
  resolved:"Cerrado",
  bot:     "Bot",
};
const STATUS_COLOR: Record<string, string> = {
  waiting: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  human:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  resolved:"bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400",
  bot:     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

export default function ChatInboxPage() {
  const params  = useParams() as { slug: string };
  const slug    = params.slug;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply,    setReply]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [filter,   setFilter]   = useState<"all"|"waiting"|"human"|"resolved">("all");

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load sessions
  async function loadSessions() {
    const res = await fetch(`/api/site/${slug}/chat/sessions${filter !== "all" ? `?status=${filter}` : ""}`);
    if (res.ok) {
      const data = await res.json();
      setSessions(data.sessions ?? []);
    }
  }

  // Load messages for selected session
  async function loadMessages(sessionId: string) {
    const res = await fetch(`/api/site/${slug}/chat/sessions/${sessionId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
      // Update status in session list
      setSessions((p) => p.map((s) => s.id === sessionId ? { ...s, status: data.status } : s));
      if (selected?.id === sessionId) {
        setSelected((p) => p ? { ...p, status: data.status } : p);
      }
    }
  }

  useEffect(() => { loadSessions(); }, [slug, filter]);

  // Poll messages when a session is open
  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);
    const interval = setInterval(() => loadMessages(selected.id), 4000);
    return () => clearInterval(interval);
  }, [selected?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openSession(s: Session) {
    setSelected(s);
    setMessages([]);
    setReply("");
    await loadMessages(s.id);
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !selected || loading) return;
    setLoading(true);
    const text = reply.trim();
    setReply("");
    await fetch(`/api/site/${slug}/chat/sessions/${selected.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    await loadMessages(selected.id);
    setLoading(false);
  }

  async function closeSession(id: string) {
    await fetch(`/api/site/${slug}/chat/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    await loadMessages(id);
    await loadSessions();
  }

  async function reopenSession(id: string) {
    await fetch(`/api/site/${slug}/chat/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "waiting" }),
    });
    await loadSessions();
    if (selected?.id === id) setSelected((p) => p ? { ...p, status: "waiting" } : p);
  }

  const filtered = sessions.filter((s) => filter === "all" || s.status === filter);

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Ahora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("es", { day: "numeric", month: "short" });
  }

  return (
    <div className="h-full flex overflow-hidden bg-white dark:bg-slate-950">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800">
          <h1 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Chat</h1>
          <div className="flex gap-1 flex-wrap">
            {(["all","waiting","human","resolved"] as const).map((f) => (
              <button key={f} onClick={() => { setFilter(f); setSelected(null); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                }`}>
                {f === "all" ? "Todos" : STATUS_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400 dark:text-slate-500">
              No hay conversaciones
            </div>
          ) : (
            filtered.map((s) => {
              const lastMsg = s.messages[0];
              return (
                <button key={s.id} onClick={() => openSession(s)}
                  className={`w-full text-left p-3 border-b border-gray-50 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
                    selected?.id === s.id ? "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-500" : ""
                  }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                      {s.clientName ?? "Visitante"}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 flex-shrink-0">
                      {formatTime(s.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate mb-1.5">
                    {lastMsg?.content ?? "Sin mensajes"}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status]}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat pane ────────────────────────────────────────── */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
                {selected.clientName ?? "Visitante"}
              </h2>
              {selected.clientEmail && (
                <p className="text-xs text-gray-400 dark:text-slate-500">{selected.clientEmail}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[selected.status]}`}>
                {STATUS_LABEL[selected.status] ?? selected.status}
              </span>
              {selected.status !== "resolved" ? (
                <button onClick={() => closeSession(selected.id)}
                  className="text-xs text-red-500 hover:text-red-600 border border-red-200 dark:border-red-900/50 px-3 py-1 rounded-lg transition-colors">
                  Cerrar
                </button>
              ) : (
                <button onClick={() => reopenSession(selected.id)}
                  className="text-xs text-blue-500 hover:text-blue-600 border border-blue-200 dark:border-blue-900/50 px-3 py-1 rounded-lg transition-colors">
                  Reabrir
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              if (msg.role === "system") {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                );
              }
              const isAdmin = msg.role === "human" || msg.role === "bot";
              return (
                <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    isAdmin
                      ? "bg-blue-500 text-white rounded-br-sm"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-sm"
                  }`}>
                    {isAdmin && msg.adminName && (
                      <p className="text-xs opacity-70 mb-0.5">{msg.adminName}</p>
                    )}
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isAdmin ? "text-white/60" : "text-gray-400 dark:text-slate-500"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          {selected.status !== "resolved" && (
            <form onSubmit={sendReply}
              className="border-t border-gray-100 dark:border-slate-800 p-4 flex gap-3 flex-shrink-0">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Escribe tu respuesta..."
                disabled={loading}
                className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button type="submit" disabled={!reply.trim() || loading}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                Enviar
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <div className="text-5xl mb-4">💬</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Selecciona una conversación</h3>
            <p className="text-sm text-gray-400 dark:text-slate-500">
              Elige un chat de la lista para responder.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
