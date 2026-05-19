"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────
interface ChatMessage {
  id: string; sessionId: string; role: "user" | "bot" | "human" | "system";
  content: string; adminId?: string | null; adminName?: string | null; createdAt: string;
}
interface ChatSession {
  id: string; clientName?: string | null; clientEmail?: string | null;
  status: "bot" | "waiting" | "human" | "resolved";
  assignedAdminId?: string | null; assignedAdminName?: string | null;
  queueId?: string | null; queueName?: string | null;
  channel?: string; whatsappFrom?: string | null;
  createdAt: string; updatedAt: string;
  messages?: ChatMessage[];
  _count?: { messages: number };
}
interface Queue {
  id: string; name: string; description?: string | null; isDefault: boolean;
  agents: SupportAgent[];
  _count: { sessions: number };
}
interface SupportAgent {
  id: string; adminId: string; adminName: string; adminEmail: string;
  isAlwaysOn: boolean; isAvailable: boolean;
  queues?: { id: string; name: string }[];
}

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

  const [tab, setTab] = useState<"chats" | "agents" | "queues" | "whatsapp">("chats");

  // WhatsApp config state
  const [waConfig, setWaConfig] = useState({ enabled: false, phoneNumberId: "", displayPhoneNumber: "", hasToken: false, verifyToken: "", appId: "", hasAppSecret: false, webhookAutoConfigured: false });
  const [waLoading, setWaLoading] = useState(false);
  const [waSaving, setWaSaving] = useState(false);
  const [waMsg, setWaMsg] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waDiscovering, setWaDiscovering] = useState(false);
  const [waDiscoverError, setWaDiscoverError] = useState("");
  const [waPhones, setWaPhones] = useState<{ id: string; displayPhoneNumber: string; verifiedName: string; wabaId: string }[]>([]);
  const [waSelectedPhone, setWaSelectedPhone] = useState<{ id: string; displayPhoneNumber: string; verifiedName: string; wabaId: string } | null>(null);
  const [waStep, setWaStep] = useState<"idle" | "selecting" | "configured">("idle");
  const [waAutoResult, setWaAutoResult] = useState<{ wabaSubscribed?: boolean; webhookRegistered?: boolean; errors: string[] } | null>(null);
  const [waAppId, setWaAppId] = useState("");
  const [waAppSecret, setWaAppSecret] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "waiting" | "human" | "bot" | "resolved">("all");
  const [queueFilter, setQueueFilter] = useState<string>("all");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [myInfo, setMyInfo] = useState<{ id: string; name: string; email: string } | null>(null);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Agent form
  const [agentForm, setAgentForm] = useState({ adminId: "", adminName: "", adminEmail: "", isAlwaysOn: false });
  const [savingAgent, setSavingAgent] = useState(false);

  // Queue form
  const [queueForm, setQueueForm] = useState({ name: "", description: "", isDefault: false });
  const [savingQueue, setSavingQueue] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load data ─────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    const res = await fetch(`/api/site/${slug}/support/sessions`);
    if (res.ok) setSessions(await res.json());
  }, [slug]);

  const loadAgents = useCallback(async () => {
    const res = await fetch(`/api/site/${slug}/support/agents`);
    if (res.ok) setAgents(await res.json());
  }, [slug]);

  const loadQueues = useCallback(async () => {
    const res = await fetch(`/api/site/${slug}/support/queues`);
    if (res.ok) setQueues(await res.json());
  }, [slug]);

  const loadSession = useCallback(async (id: string) => {
    const res = await fetch(`/api/site/${slug}/support/sessions/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setActiveSession(data);
    setMessages(data.messages || []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [slug]);

  const loadWaConfig = useCallback(async () => {
    setWaLoading(true);
    const res = await fetch(`/api/site/${slug}/support/whatsapp`);
    if (res.ok) {
      const d = await res.json();
      setWaConfig({ enabled: d.enabled, phoneNumberId: d.phoneNumberId, displayPhoneNumber: d.displayPhoneNumber || "", hasToken: !!d.hasToken, verifyToken: d.verifyToken, appId: d.appId || "", hasAppSecret: !!d.hasAppSecret, webhookAutoConfigured: !!d.webhookAutoConfigured });
      if (d.appId) setWaAppId(d.appId);
      if (d.phoneNumberId && d.hasToken) setWaStep("configured");
    }
    setWaLoading(false);
  }, [slug]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const sessRes = await fetch("/api/auth/session");
      if (sessRes.ok) {
        const s = await sessRes.json();
        const u = s?.user;
        if (u) setMyInfo({ id: u.id || u.adminId || "", name: u.name || "", email: u.email || "" });
      }
      await Promise.all([loadSessions(), loadAgents(), loadQueues(), loadWaConfig()]);
      setLoading(false);
    }
    init();
  }, [loadSessions, loadAgents, loadQueues, loadWaConfig]);

  // Polling every 4s
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
    if (activeSession?.id === sessionId) { setActiveSession(null); setMessages([]); }
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
    await Promise.all([loadAgents(), loadQueues()]);
    setAgentForm({ adminId: "", adminName: "", adminEmail: "", isAlwaysOn: false });
    setSavingAgent(false);
  }

  async function deleteAgent(id: string) {
    await fetch(`/api/site/${slug}/support/agents/${id}`, { method: "DELETE" });
    loadAgents();
  }

  async function toggleAgentAvailability(agent: SupportAgent) {
    await fetch(`/api/site/${slug}/support/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !agent.isAvailable }),
    });
    loadAgents();
  }

  async function saveQueue() {
    if (!queueForm.name.trim()) return;
    setSavingQueue(true);
    await fetch(`/api/site/${slug}/support/queues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queueForm),
    });
    await loadQueues();
    setQueueForm({ name: "", description: "", isDefault: false });
    setSavingQueue(false);
  }

  async function deleteQueue(id: string) {
    await fetch(`/api/site/${slug}/support/queues/${id}`, { method: "DELETE" });
    loadQueues();
  }

  async function addAgentToQueue(queueId: string, agentId: string) {
    await fetch(`/api/site/${slug}/support/queues/${queueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addAgentId: agentId }),
    });
    await Promise.all([loadQueues(), loadAgents()]);
  }

  async function removeAgentFromQueue(queueId: string, agentId: string) {
    await fetch(`/api/site/${slug}/support/queues/${queueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeAgentId: agentId }),
    });
    await Promise.all([loadQueues(), loadAgents()]);
  }

  async function setQueueDefault(queueId: string) {
    await fetch(`/api/site/${slug}/support/queues/${queueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    loadQueues();
  }

  // ── Filtered sessions ─────────────────────────────────────────
  const filtered = sessions.filter((s) => {
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchQueue = queueFilter === "all" || s.queueId === queueFilter || (queueFilter === "__none" && !s.queueId);
    return matchStatus && matchQueue;
  });
  const waitingCount = sessions.filter((s) => s.status === "waiting").length;

  // Pre-compute queue-split agents for assign dropdown (avoids IIFE in JSX)
  const assignQueueAgents = activeSession?.queueId
    ? agents.filter((a) => a.adminId !== myInfo?.id && a.queues?.some((q) => q.id === activeSession.queueId))
    : [];
  const assignOtherAgents = agents.filter(
    (a) => a.adminId !== myInfo?.id && !assignQueueAgents.some((qa) => qa.id === a.id)
  );

  // Agents not in a given queue (for the add-to-queue dropdown)
  function agentsNotInQueue(q: Queue) {
    const inQueue = new Set(q.agents.map((a) => a.id));
    return agents.filter((a) => !inQueue.has(a.id));
  }

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
        <div className="flex items-center gap-3">
          <Link href={`/site/${slug}/admin/support/metrics`}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
            <span>📊</span> Métricas
          </Link>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(["chats", "agents", "queues", "whatsapp"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                {t === "chats" ? "Conversaciones" : t === "agents" ? "Agentes" : t === "queues" ? "Colas" : "📱 WhatsApp"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── WHATSAPP TAB ─────────────────────────────────────────── */}
      {tab === "whatsapp" && (
        <div className="flex-1 overflow-auto p-6 space-y-6 max-w-2xl">
          {waLoading ? (
            <p className="text-gray-400 text-sm">Cargando configuración...</p>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900">WhatsApp Business</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Conecta tu número de WhatsApp Business para recibir y responder mensajes con IA</p>
                  </div>
                  {waStep === "configured" && (
                    <div
                      onClick={async () => {
                        const next = !waConfig.enabled;
                        setWaConfig((p) => ({ ...p, enabled: next }));
                        await fetch(`/api/site/${slug}/support/whatsapp`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ enabled: next }),
                        });
                      }}
                      className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${waConfig.enabled ? "bg-green-500" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${waConfig.enabled ? "left-5" : "left-0.5"}`} />
                    </div>
                  )}
                </div>

                {/* ── CONFIGURED STATE ── */}
                {waStep === "configured" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-green-800">
                          {waConfig.displayPhoneNumber || "Número conectado"}
                        </p>
                        <p className="text-xs text-green-600">WhatsApp Business conectado · {waConfig.enabled ? "Activo" : "Desactivado"}</p>
                      </div>
                      <button
                        onClick={() => { setWaStep("idle"); setWaToken(""); setWaPhones([]); setWaSelectedPhone(null); setWaDiscoverError(""); setWaAutoResult(null); setWaAppSecret(""); }}
                        className="ml-auto text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                        Cambiar número
                      </button>
                    </div>

                    {/* Automation result */}
                    {waAutoResult && (
                      <div className="space-y-1.5">
                        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${waAutoResult.wabaSubscribed ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                          {waAutoResult.wabaSubscribed ? "✅" : "⬜"} WABA suscrito al app
                        </div>
                        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${waAutoResult.webhookRegistered ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                          {waAutoResult.webhookRegistered ? "✅" : "⚠️"} {waAutoResult.webhookRegistered ? "Webhook configurado automáticamente" : "Webhook no auto-configurado (configura META_APP_ID y META_APP_SECRET)"}
                        </div>
                        {waAutoResult.errors.length > 0 && (
                          <div className="text-xs text-red-600 px-3 py-2 bg-red-50 rounded-lg">
                            {waAutoResult.errors.join(" · ")}
                          </div>
                        )}
                      </div>
                    )}

                    {waConfig.verifyToken && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Token de verificación del webhook</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 break-all">
                            {waConfig.verifyToken}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(waConfig.verifyToken).then(() => setWaMsg("✓ Copiado")).catch(() => {})}
                            className="text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors whitespace-nowrap">
                            Copiar
                          </button>
                        </div>
                      </div>
                    )}

                    {waMsg && <p className="text-sm text-green-600 font-medium">{waMsg}</p>}
                  </div>
                )}

                {/* ── IDLE: Enter credentials ── */}
                {waStep === "idle" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Access Token (token permanente de sistema)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={waToken}
                          onChange={(e) => { setWaToken(e.target.value); setWaDiscoverError(""); }}
                          placeholder="EAAxxxxxxxxxx..."
                          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={async () => {
                            if (!waToken.trim()) return;
                            setWaDiscovering(true); setWaDiscoverError("");
                            const res = await fetch(`/api/site/${slug}/support/whatsapp/discover`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ token: waToken }),
                            });
                            const d = await res.json();
                            setWaDiscovering(false);
                            if (!res.ok) { setWaDiscoverError(d.error || "Error al conectar con Meta"); return; }
                            if (!d.phones?.length) { setWaDiscoverError("No se encontraron números asociados a este token."); return; }
                            setWaPhones(d.phones);
                            setWaSelectedPhone(d.phones.length === 1 ? d.phones[0] : null);
                            setWaStep("selecting");
                          }}
                          disabled={waDiscovering || !waToken.trim()}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                          {waDiscovering ? "Buscando..." : "Descubrir números →"}
                        </button>
                      </div>
                      {waDiscoverError && <p className="text-xs text-red-600 mt-1">{waDiscoverError}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Meta for Developers → Tu App → WhatsApp → API Setup → System User Token
                      </p>
                    </div>

                    {/* App ID + Secret for full automation */}
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        Automatización completa del webhook (opcional)
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">App ID</label>
                          <input
                            value={waAppId}
                            onChange={(e) => setWaAppId(e.target.value)}
                            placeholder="123456789"
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            App Secret {waConfig.hasAppSecret ? "(ya guardado)" : ""}
                          </label>
                          <input
                            type="password"
                            value={waAppSecret}
                            onChange={(e) => setWaAppSecret(e.target.value)}
                            placeholder={waConfig.hasAppSecret ? "••••••• (sin cambios)" : "abc123..."}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        Con esto el webhook se configura automáticamente en Meta. Encuéntralo en: Meta for Developers → Tu App → Configuración → Básica
                      </p>
                    </div>
                  </div>
                )}

                {/* ── SELECTING: Choose phone ── */}
                {waStep === "selecting" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Selecciona el número a conectar:</p>
                      <div className="space-y-2">
                        {waPhones.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setWaSelectedPhone(p)}
                            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors ${
                              waSelectedPhone?.id === p.id
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}>
                            <span className="text-xl">📱</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{p.displayPhoneNumber}</p>
                              {p.verifiedName && <p className="text-xs text-gray-500">{p.verifiedName}</p>}
                            </div>
                            {waSelectedPhone?.id === p.id && <span className="ml-auto text-green-600 font-bold">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {waMsg && <p className={`text-sm font-medium ${waMsg.includes("Error") ? "text-red-600" : "text-green-600"}`}>{waMsg}</p>}

                    <div className="flex gap-2">
                      <button onClick={() => { setWaStep("idle"); setWaPhones([]); setWaSelectedPhone(null); }}
                        className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                        Atrás
                      </button>
                      <button
                        onClick={async () => {
                          if (!waSelectedPhone) return;
                          setWaSaving(true); setWaMsg(""); setWaAutoResult(null);
                          const res = await fetch(`/api/site/${slug}/support/whatsapp`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              token: waToken,
                              phoneNumberId: waSelectedPhone.id,
                              displayPhoneNumber: waSelectedPhone.displayPhoneNumber,
                              wabaId: waSelectedPhone.wabaId,
                              appId: waAppId || undefined,
                              appSecret: waAppSecret || undefined,
                              enabled: true,
                            }),
                          });
                          setWaSaving(false);
                          if (res.ok) {
                            const d = await res.json();
                            setWaAutoResult(d.automation ?? null);
                            setWaToken("");
                            await loadWaConfig();
                          } else {
                            setWaMsg("Error al guardar");
                          }
                        }}
                        disabled={waSaving || !waSelectedPhone}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                        {waSaving ? "Conectando..." : "Conectar WhatsApp"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Webhook instructions — only show if not auto-configured */}
              {waConfig.webhookAutoConfigured ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
                  <p className="font-semibold">✅ Webhook completamente automatizado</p>
                  <p className="text-xs text-green-600 mt-1">
                    El sistema configura el webhook automáticamente al conectar un número. No necesitas hacer nada en Meta Developer Console.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-800 space-y-2">
                  <p className="font-semibold">Configuración manual del webhook en Meta:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-blue-700">
                    <li>Ve a <strong>Meta for Developers</strong> → Tu App → WhatsApp → Configuration</li>
                    <li>En <em>Webhook</em>, haz clic en <strong>Edit</strong></li>
                    <li>URL del callback:
                      <code className="block bg-blue-100 px-2 py-1 rounded mt-1 text-xs break-all">
                        {typeof window !== "undefined" ? window.location.origin : "https://tu-dominio.com"}/api/webhooks/whatsapp
                      </code>
                    </li>
                    <li>Verify Token: <strong>el token que aparece en la sección de arriba</strong></li>
                    <li>Suscríbete al campo <strong>messages</strong></li>
                  </ol>
                  <p className="text-blue-500 text-xs mt-1">
                    Para automatizar esto, agrega <code className="bg-blue-100 px-1 rounded">META_APP_ID</code> y <code className="bg-blue-100 px-1 rounded">META_APP_SECRET</code> a tus variables de entorno.
                  </p>
                  <p className="text-blue-600 text-xs">Los mensajes de WhatsApp aparecerán en la pestaña <strong>Conversaciones</strong> con el ícono 📱</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── QUEUES TAB ────────────────────────────────────────────── */}
      {tab === "queues" && (
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Create queue */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Crear cola de atención</h2>
            <p className="text-sm text-gray-400 mb-4">
              Las colas agrupan conversaciones por tipo. Los clientes eligen la cola al solicitar un agente.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la cola *</label>
                <input value={queueForm.name} onChange={(e) => setQueueForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Soporte Técnico, Ventas, Info General"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
                <input value={queueForm.description} onChange={(e) => setQueueForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="¿Qué tipo de consultas atiende?"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setQueueForm((p) => ({ ...p, isDefault: !p.isDefault }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${queueForm.isDefault ? "bg-blue-600" : "bg-gray-200"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${queueForm.isDefault ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-800">Cola predeterminada</p>
                <p className="text-xs text-gray-400">Los chats sin cola asignada se enrutan aquí.</p>
              </div>
            </div>
            <button onClick={saveQueue} disabled={savingQueue || !queueForm.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">
              {savingQueue ? "Creando..." : "Crear cola"}
            </button>
          </div>

          {/* Queue list */}
          {queues.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">No hay colas creadas. Crea una para empezar a organizar tu soporte.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queues.map((q) => {
                const notInQueue = agentsNotInQueue(q);
                return (
                  <div key={q.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {/* Queue header */}
                    <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {q.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">{q.name}</p>
                            {q.isDefault && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Predeterminada</span>
                            )}
                          </div>
                          {q.description && <p className="text-xs text-gray-400">{q.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{q._count.sessions} conversacion(es)</span>
                        {!q.isDefault && (
                          <button onClick={() => setQueueDefault(q.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                            Hacer predeterminada
                          </button>
                        )}
                        <button onClick={() => deleteQueue(q.id)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors">
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Agents in this queue */}
                    <div className="px-5 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Agentes asignados ({q.agents.length})
                      </p>
                      {q.agents.length === 0 ? (
                        <p className="text-xs text-gray-400 italic mb-2">Sin agentes asignados</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {q.agents.map((a) => (
                            <div key={a.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                                {a.adminName[0]}
                              </div>
                              <span className="text-xs font-medium text-gray-800">{a.adminName}</span>
                              {a.isAlwaysOn && (
                                <span className="text-xs text-blue-500">● siempre</span>
                              )}
                              <button onClick={() => removeAgentFromQueue(q.id, a.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors leading-none ml-0.5">×</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add agent to queue */}
                      {notInQueue.length > 0 && (
                        <div className="flex items-center gap-2">
                          <select
                            onChange={(e) => { if (e.target.value) { addAgentToQueue(q.id, e.target.value); e.target.value = ""; } }}
                            className="text-xs border border-dashed border-gray-300 rounded-lg px-2 py-1 text-gray-500 focus:outline-none focus:border-blue-400">
                            <option value="">+ Agregar agente a esta cola</option>
                            {notInQueue.map((a) => (
                              <option key={a.id} value={a.id}>{a.adminName}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {notInQueue.length === 0 && agents.length > 0 && q.agents.length === agents.length && (
                        <p className="text-xs text-gray-400 italic">Todos los agentes están asignados a esta cola</p>
                      )}
                      {agents.length === 0 && (
                        <p className="text-xs text-gray-400 italic">Primero crea agentes en la pestaña Agentes</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── AGENTS TAB ────────────────────────────────────────────── */}
      {tab === "agents" && (
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Agregar agente de soporte</h2>
            <p className="text-sm text-gray-400 mb-4">Los agentes pueden tomar el control de conversaciones con clientes.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input value={agentForm.adminName} onChange={(e) => setAgentForm((p) => ({ ...p, adminName: e.target.value }))}
                  placeholder="Juan Lopez"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input value={agentForm.adminEmail} onChange={(e) => setAgentForm((p) => ({ ...p, adminEmail: e.target.value }))}
                  placeholder="juan@empresa.com"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setAgentForm((p) => ({ ...p, isAlwaysOn: !p.isAlwaysOn }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${agentForm.isAlwaysOn ? "bg-blue-600" : "bg-gray-200"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${agentForm.isAlwaysOn ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-800">Siempre activo</p>
                <p className="text-xs text-gray-400">
                  Se auto-asigna en las colas donde esté registrado. Si está desactivado, el admin lo asigna manualmente.
                </p>
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
                  <div key={a.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
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
                        <button onClick={() => toggleAgentAvailability(a)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${a.isAvailable ? "bg-green-500" : "bg-gray-200"}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${a.isAvailable ? "translate-x-4.5" : "translate-x-0.5"}`} />
                        </button>
                        <span className="text-xs text-gray-400">{a.isAvailable ? "Disponible" : "No disponible"}</span>
                        <button onClick={() => deleteAgent(a.id)} className="text-xs text-red-500 hover:text-red-700 transition-colors">Eliminar</button>
                      </div>
                    </div>
                    {/* Queue badges for this agent */}
                    {a.queues && a.queues.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 pl-12">
                        {a.queues.map((q) => (
                          <span key={q.id} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{q.name}</span>
                        ))}
                      </div>
                    )}
                    {(!a.queues || a.queues.length === 0) && (
                      <p className="text-xs text-amber-600 mt-1 pl-12">Sin colas asignadas — asígnalas en la pestaña Colas</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CHATS TAB ────────────────────────────────────────────── */}
      {tab === "chats" && (
        <div className="flex-1 flex min-h-0">
          {/* Session list */}
          <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col bg-white">
            {/* Status filter */}
            <div className="p-3 border-b border-gray-100 flex gap-1 flex-wrap">
              {(["all", "waiting", "human", "bot", "resolved"] as const).map((f) => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {f === "all" ? "Todos" : STATUS_INFO[f]?.label}
                  {f === "waiting" && waitingCount > 0 && (
                    <span className="ml-1 bg-white text-amber-600 rounded-full px-1">{waitingCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Queue filter */}
            {queues.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-100 flex gap-1 flex-wrap">
                <button onClick={() => setQueueFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${queueFilter === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  Todas las colas
                </button>
                {queues.map((q) => (
                  <button key={q.id} onClick={() => setQueueFilter(q.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${queueFilter === q.id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {q.name}
                  </button>
                ))}
                <button onClick={() => setQueueFilter("__none")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${queueFilter === "__none" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  Sin cola
                </button>
              </div>
            )}

            {/* Sessions */}
            <div className="flex-1 overflow-auto">
              {filtered.length === 0 ? (
                <p className="p-4 text-xs text-gray-400 text-center">Sin conversaciones</p>
              ) : (
                filtered.map((s) => (
                  <button key={s.id} onClick={() => loadSession(s.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${activeSession?.id === s.id ? "bg-blue-50 border-l-2 border-l-blue-500" : ""}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1">
                        {s.channel === "whatsapp" && <span title="WhatsApp">📱</span>}
                        {s.clientName || "Cliente anónimo"}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(s.updatedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <StatusBadge status={s.status} />
                      {s.queueName && (
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">
                          {s.queueName}
                        </span>
                      )}
                    </div>
                    {s.assignedAdminName && (
                      <p className="text-xs text-gray-400 mt-0.5">→ {s.assignedAdminName}</p>
                    )}
                    {s._count && s._count.messages > 0 && (
                      <p className="text-xs text-gray-300 mt-0.5">{s._count.messages} msgs</p>
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
                <div className="px-5 py-3.5 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                      {(activeSession.clientName || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">{activeSession.clientName || "Cliente anónimo"}</p>
                        {activeSession.queueName && (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                            {activeSession.queueName}
                          </span>
                        )}
                      </div>
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
                    {/* Assign dropdown — show agents from session's queue first */}
                    {activeSession.status !== "resolved" && agents.filter((a) => a.adminId !== myInfo?.id).length > 0 && (
                      <div className="relative group">
                        <button className="border border-gray-200 hover:border-gray-300 text-gray-600 px-3 py-2 rounded-xl text-xs font-medium transition-colors">
                          Asignar ▾
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-48 hidden group-hover:block">
                          {/* Queue agents first */}
                          {assignQueueAgents.length > 0 && (
                            <>
                              <p className="px-3 pt-2 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">
                                Cola: {activeSession.queueName}
                              </p>
                              {assignQueueAgents.map((a) => (
                                <button key={a.id} onClick={() => assignTo(activeSession.id, a)}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 transition-colors">
                                  {a.adminName} {a.isAlwaysOn ? "★" : ""}
                                </button>
                              ))}
                              <div className="border-t border-gray-100 my-1" />
                            </>
                          )}
                          {/* All other agents */}
                          {assignOtherAgents.map((a) => (
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
                        <div className="max-w-xs lg:max-w-md">
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

                {/* Input */}
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
                    El cliente está esperando un agente
                    {activeSession.queueName && ` en la cola "${activeSession.queueName}"`}.
                    Haz clic en <strong>Tomar control</strong> para chatear.
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
