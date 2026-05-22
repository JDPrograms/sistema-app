"use client";
import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "bot" | "human" | "system";
  content: string;
  adminName?: string | null;
  createdAt: string;
}

interface Props {
  slug: string;
  primaryColor: string;
  businessName: string;
}

export default function ChatWidget({ slug, primaryColor, businessName }: Props) {
  const [open,      setOpen]      = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") return sessionStorage.getItem(`chat_${slug}`);
    return null;
  });
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [status,    setStatus]    = useState<string>("waiting");
  const [sending,   setSending]   = useState(false);
  const [step,      setStep]      = useState<"form" | "chat">(sessionId ? "chat" : "form");
  const [form,      setForm]      = useState({ name: "", email: "" });
  const [unread,    setUnread]    = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages when session is active and widget is open
  useEffect(() => {
    if (!sessionId) return;
    async function poll() {
      const res = await fetch(`/api/site/${slug}/chat/sessions/${sessionId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
      setStatus(data.status ?? "waiting");
      if (!open) {
        setUnread((prev) => {
          const newCount = (data.messages ?? []).filter((m: Message) => m.role !== "user" && m.role !== "system").length;
          return newCount > prev ? newCount : prev;
        });
      }
    }
    poll();
    pollRef.current = setInterval(poll, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionId, slug, open]);

  function openWidget() {
    setOpen(true);
    setUnread(0);
  }

  async function startChat() {
    if (!form.name.trim()) return;
    const res = await fetch(`/api/site/${slug}/chat/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName: form.name, clientEmail: form.email || undefined }),
    });
    if (!res.ok) return;
    const data = await res.json();
    sessionStorage.setItem(`chat_${slug}`, data.sessionId);
    setSessionId(data.sessionId);
    setStep("chat");
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !sessionId || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    setMessages((p) => [...p, {
      id: Date.now().toString(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    }]);
    await fetch(`/api/site/${slug}/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    setSending(false);
  }

  const roleLabel: Record<string, string> = {
    user: "Tú",
    bot: "Bot",
    human: "Agente",
    system: "",
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={openWidget}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg shadow-black/20 flex items-center justify-center text-white text-2xl transition-all hover:scale-110 active:scale-95"
        style={{ backgroundColor: primaryColor }}
        aria-label="Abrir chat">
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden"
          style={{ maxHeight: "28rem" }}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0" style={{ backgroundColor: primaryColor }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
              {businessName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{businessName}</p>
              <p className="text-xs text-white/70">
                {status === "human" ? "Agente conectado" : status === "resolved" ? "Chat cerrado" : "Respondemos pronto"}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {step === "form" ? (
            /* ── Intro form ─────────────────────────────── */
            <div className="flex-1 p-4 space-y-4">
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                Hola 👋 ¿En qué podemos ayudarte? Escribe tu nombre para comenzar.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Tu nombre *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && startChat()}
                  placeholder="Juan García"
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": primaryColor } as any}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Email (opcional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": primaryColor } as any}
                />
              </div>
              <button
                onClick={startChat}
                disabled={!form.name.trim()}
                className="w-full py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity disabled:opacity-40"
                style={{ backgroundColor: primaryColor }}>
                Iniciar chat →
              </button>
            </div>
          ) : (
            /* ── Chat ────────────────────────────────────── */
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
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
                  const isUser = msg.role === "user";
                  return (
                    <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        isUser
                          ? "text-white rounded-br-sm"
                          : "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-sm"
                      }`} style={isUser ? { backgroundColor: primaryColor } : {}}>
                        {!isUser && msg.adminName && (
                          <p className="text-xs font-semibold opacity-60 mb-0.5">{msg.adminName}</p>
                        )}
                        <p className="leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
                {status === "waiting" && messages.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 flex gap-1 items-center">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {status !== "resolved" ? (
                <form onSubmit={sendMessage} className="border-t border-gray-100 dark:border-slate-700 p-3 flex gap-2 flex-shrink-0">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    disabled={sending}
                    className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 disabled:opacity-50"
                    style={{ "--tw-ring-color": primaryColor } as any}
                  />
                  <button type="submit" disabled={!input.trim() || sending}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-opacity"
                    style={{ backgroundColor: primaryColor }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              ) : (
                <div className="border-t border-gray-100 dark:border-slate-700 p-3 text-center text-xs text-gray-400 dark:text-slate-500 flex-shrink-0">
                  Chat cerrado por el agente
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
