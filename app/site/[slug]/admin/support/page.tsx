"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────
interface ChatMessage {
  id: string; sessionId: string; role: "user" | "bot" | "human" | "system";
  content: string; adminId?: string | null; adminName?: string | null; createdAt: string;
}
interface ChatSession {
  id: string; clientName?: string | null; clientEmail?: string | null;
  status: "bot" | "waiting" | "human" | "resolved";
  assignedAdminId?: string | null; assignedAdminName?: string | null;
  createdAt: string; updatedAt: string;
  messages?: ChatMessage[];
  _count?: { messages: number };
}
interface SupportAgent {
  id: string; adminId: string; adminName: string; adminEmail: string;
  isAlwaysOn: boolean; isAvailable: boolean;
}
interface SiteAdmin { id: string; name: string; email: string; }

const STATUS_INFO: Record<string, { label: string; cls: string; dot: string }> = {
  bot:      { label: "Bot",         cls: "bg-blue-100 text-blue-700",   dot: "bg-blue-400" },
  waiting:  { label: "Esperando",   cls: "bg-amber-100 text-amber-700", dot: "bg-amber-400 animate-pulse" },
  human:    { label: "En vivo",     cls: "bg-green-100 text-green-700", dot: "bg-green-400" },
  resolved: { label: "Resuelto",    cls: "bg-gray-100 text-gray-500",   dot: "bg-gray-400" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_INFO[status] || STATUS_INFO.bot;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ── Main ─────────────────────────────────────────────────────────
export default function SupportPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [tab, setTab] = useState<"chats" | "agents">("chats");
  const [filter, setFilter] = useState<"all" | "waiting" | "human" | "bot" | "resolved">("all");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [admins, setAdmins] = useState<SiteAdmin[]>([]);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [myInfo, setMyInfo] = useState<{ id: string; name: string; email: string } | null>(null);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agentForm, setAgentForm] = useState({ adminId: "", adminName: "", adminEmail: "", isAlwaysOn: false });
  const [savingAgent, setSavingAgent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load data ─────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    const res = await fetch(`/api/site/${slug}/support/sessions`);
    if (res.ok) setSessions(await res.json());
  }, [slug]);

  const loadAgents = useCallback(async () => {
    const [agentsRes, adminsRes] = await Promise.all([
      fetch(`/api/site/${slug}/support/agents`),
      fetch(`/api/admin/sites`).then(() => null).catch(() => null),
    ]);
    if (agentsRes.ok) setAgents(await agentsRes.json());
  }, [slug]);

  const loadSession = useCallback(async (id: string) => {
    const res = await fetch(`/api/site/${slug}/support/sessions/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setActiveSession(data);
    setMessages(data.messages || []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [slug]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      // Get my session info
      const sessRes = await fetch("/api/auth/session");
      if (sessRes.ok) {
        const s = await sessRes.json();
        const u = s?.user;
        if (u) setMyInfo({ id: u.id || u.adminId || "", name: u.name || "", email: u.email || "" });
      }
      await Promise.all([loadSessions(), loadAgents()]);
      setLoading(false);
    }
    init();
  }, [loadSessions, loadAgents]);

  // Polling — refresh sessions and active conversation every 4s
  useEffect(() => {
    const t = setInterval(() => {
      loadSessions();
      if (activeSession) loadSession(activeSession.id);
    }, 4000);
    return () => clearInterval(t);
  }, [loadSessions, loadSession, activeSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Actions ───────────────────────────────────────────────────
  async function takeover(sessionId: string) {
    if (!myInfo) return;
    await fetch(`/api/site/${slug}/support/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "human", assignedAdminId: myInfo.id, assignedAdminName: myInfo.name }),
    });
    await loadSessions();
    loadSession(sessionId);
  }

  async function assignTo(sessionId: string, agent: SupportAgent) {
    await fetch(`/api/site/${slug}/support/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "human", assignedAdminId: agent.adminId, assignedAdminName: agent.adminName }),
    });
    await loadSessions();
    if (activeSession?.id === sessionId) loadSession(sessionId);
  }

  async function resolve(sessionId: string) {
    await fetch(`/api/site/${slug}/support/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    await loadSessions();
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
      setMessages([]);
    }
  }

  async function sendMsg() {
    const text = msgInput.trim();
    if (!text || !activeSession || sending || !myInfo) return;
    setSending(true);
    setMsgInput("");
    await fetch(`/api/site/${slug}/support/sessions/${activeSession.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, role: "human", adminId: myInfo.id, adminName: myInfo.name }),
    });
    await loadSession(activeSession.id);
    setSending(false);
  }

  async function saveAgent() {
    if (!agentForm.adminName || !agentForm.adminEmail) return;
    setSavingAgent(true);
    await fetch(`/api/site/${slug}/support/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...agentForm, adminId: agentForm.adminId || agentForm.adminEmail }),
    });
    await loadAgents();
    setAgentForm({ adminId: "", adminName: "", adminEmail: "", isAlwaysOn: false });
    setSavingAgent(false);
  }

  async function deleteAgent(id: string) {
    await fetch(`/api/site/${slug}/support/agents/${id}`, { method: "DELETE" });
    loadAgents();
  }

  async function toggleAgent(agent: SupportAgent) {
    await fetch(`/api/site/${slug}/support/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !agent.isAvailable }),
    });
    loadAgents();
  }

  // ── Filtered sessions ─────────────────────────────────────────
  const filtered = sessions.filter((s) => filter === "all" || s.status === filter);
  const waitingCount = sessions.filter((s) => s.status === "waiting").length;

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">💬 Soporte en Vivo</h1>
          {waitingCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {waitingCount} esperando
            </span>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setTab("chats")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "chats" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            Conversaciones
          </button>
          <button onClick={() => setTab("agents")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "agents" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            Agentes
          </button>
        </div>
      </div>

      {tab === "agents" ? (
        /* ── AGENTS TAB ─────────────────────────────────────────── */
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Agregar agente de soporte</h2>
            <p className="text-sm text-gray-400 mb-4">Los agentes pueden tomar el control de conversaciones con clientes.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input value={agentForm.adminName} onChange={(e) => setAgentForm((p) => ({ ...p, adminName: e.target.value }))}
                  placeholder="Juan Lopez" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input value={agentForm.adminEmail} onChange={(e) => setAgentForm((p) => ({ ...p, adminEmail: e.target.value }))}
                  placeholder="juan@empresa.com" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setAgentForm((p) => ({ ...p, isAlwaysOn: !p.isAlwaysOn }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${agentForm.isAlwaysOn ? "bg-blue-600" : "bg-gray-200"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${agentForm.isAlwaysOn ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-800">Siempre activo</p>
                <p className="text-xs text-gray-400">Le llegarán todas las conversaciones automáticamente. Si está desactivado, solo se asigna manualmente.</p>
              </div>
            </div>
            <button onClick={saveAgent} disabled={savingAgent || !agentForm.adminName || !agentForm.adminEmail}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">
              {savingAgent ? "Guardando..." : "Agregar agente"}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Agentes configurados</h2>
            </div>
            {agents.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No hay agentes configurados.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {agents.map((a) => (
                  <div key={a.id} className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
                        {a.adminName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{a.adminName}</p>
                        <p className="text-xs text-gray-400">{a.adminEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.isAlwaysOn ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                        {a.isAlwaysOn ? "Siempre activo" : "Manual"}
                      </span>
                      <button onClick={() => toggleAgent(a)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${a.isAvailable ? "bg-green-500" : "bg-gray-200"}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${a.isAvailable ? "translate-x-4.5" : "translate-x-0.5"}`} />
                      </button>
                      <span className="text-xs text-gray-400">{a.isAvailable ? "Disponible" : "No disponible"}</span>
                      <button onClick={() => deleteAgent(a.id)} className="text-xs text-red-500 hover:text-red-700 transition-colors">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── CHATS TAB ──────────────────────────────────────────── */
        <div className="flex-1 flex min-h-0">
          {/* Session list */}
          <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col bg-white">
            {/* Filter bar */}
            <div className="p-3 border-b border-gray-100 flex gap-1 flex-wrap">
              {(["all", "waiting", "human", "bot", "resolved"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {f === "all" ? "Todos" : STATUS_INFO[f]?.label}
                  {f === "waiting" && waitingCount > 0 && (
                    <span className="ml-1 bg-white text-amber-600 rounded-full px-1">{waitingCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Sessions */}
            <div className="flex-1 overflow-auto">
              {filtered.length === 0 ? (
                <p className="p-4 text-xs text-gray-400 text-center">Sin conversaciones</p>
              ) : (
                filtered.map((s) => (
                  <button key={s.id} onClick={() => loadSession(s.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${activeSession?.id === s.id ? "bg-blue-50 border-l-2 border-l-blue-500" : ""}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.clientName || "Cliente anónimo"}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(s.updatedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={s.status} />
                      {s._count && s._count.messages > 0 && (
                        <span className="text-xs text-gray-400">{s._count.messages} msgs</span>
                      )}
                    </div>
                    {s.assignedAdminName && (
                      <p className="text-xs text-gray-400 mt-0.5">→ {s.assignedAdminName}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat view */}
          <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
            {!activeSession ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl mb-2">💬</p>
                  <p className="text-gray-400 text-sm">Selecciona una conversacion para verla</p>
                  {waitingCount > 0 && (
                    <p className="text-amber-600 text-sm font-medium mt-2">{waitingCount} conversacion(es) esperan atencion humana</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-5 py-3.5 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                      {(activeSession.clientName || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{activeSession.clientName || "Cliente anónimo"}</p>
                      {activeSession.clientEmail && <p className="text-xs text-gray-400">{activeSession.clientEmail}</p>}
                    </div>
                    <StatusBadge status={activeSession.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    {activeSession.status === "waiting" && (
                      <button onClick={() => takeover(activeSession.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                        Tomar control
                      </button>
                    )}
                    {activeSession.status === "human" && myInfo && activeSession.assignedAdminId !== myInfo.id && (
                      <button onClick={() => takeover(activeSession.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                        Reasignarme
                      </button>
                    )}
                    {agents.filter((a) => a.adminId !== myInfo?.id).length > 0 && activeSession.status !== "resolved" && (
                      <div className="relative group">
                        <button className="border border-gray-200 hover:border-gray-300 text-gray-600 px-3 py-2 rounded-xl text-xs font-medium transition-colors">
                          Asignar ▾
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-40 hidden group-hover:block">
                          {agents.filter((a) => a.adminId !== myInfo?.id).map((a) => (
                            <button key={a.id} onClick={() => assignTo(activeSession.id, a)}
                              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl">
                              {a.adminName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {activeSession.status !== "resolved" && (
                      <button onClick={() => resolve(activeSession.id)}
                        className="border border-gray-200 hover:border-red-200 hover:text-red-600 text-gray-500 px-3 py-2 rounded-xl text-xs font-medium transition-colors">
                        Cerrar
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto p-4 space-y-2">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : m.role === "system" ? "justify-center" : "justify-start"}`}>
                      {m.role === "system" ? (
                        <p className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{m.content}</p>
                      ) : (
                        <div className={`max-w-xs lg:max-w-md`}>
                          {(m.role === "bot" || m.role === "human") && (
                            <p className="text-xs text-gray-400 mb-0.5 px-1">
                              {m.role === "bot" ? "🤖 Bot" : `👤 ${m.adminName || "Agente"}`}
                            </p>
                          )}
                          <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            m.role === "user" ? "bg-gray-800 text-white rounded-br-sm" :
                            m.role === "human" ? "bg-blue-600 text-white rounded-bl-sm" :
                            "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                          }`}>
                            {m.content}
                          </div>
                          <p className="text-xs text-gray-300 mt-0.5 px-1">
                            {new Date(m.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input — only when in human mode and assigned to me */}
                {activeSession.status === "human" && (
                  <div className="p-3 bg-white border-t border-gray-100 flex gap-2 flex-shrink-0">
                    <input
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMsg()}
                      placeholder="Escribe un mensaje al cliente..."
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={sendMsg} disabled={sending || !msgInput.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors">
                      →
                    </button>
                  </div>
                )}
                {activeSession.status === "waiting" && (
                  <div className="p-3 bg-amber-50 border-t border-amber-100 text-center text-xs text-amber-700 flex-shrink-0">
                    El cliente está esperando un agente. Haz clic en <strong>Tomar control</strong> para chatear.
                  </div>
                )}
                {activeSession.status === "resolved" && (
                  <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400 flex-shrink-0">
                    Conversacion finalizada
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
