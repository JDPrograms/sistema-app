"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  provider?: string;
}

interface MonitorAlert {
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  siteName?: string;
  siteSlug?: string;
}

interface MonitorReport {
  alerts: MonitorAlert[];
  summary: {
    totalSites: number;
    activeSites: number;
    totalAppointmentsToday: number;
    pendingAppointments: number;
    newSitesLast7Days: number;
    newUsersLast7Days: number;
  };
  generatedAt: string;
}

const QUICK_PROMPTS = [
  { label: "Estado general", text: "Dame un resumen completo del estado actual de la plataforma." },
  { label: "¿Qué sitios necesitan atención?", text: "¿Qué sitios requieren atención urgente ahora mismo?" },
  { label: "Tendencias de crecimiento", text: "¿Cómo está creciendo la plataforma? Analiza las tendencias." },
  { label: "Sugerencias de mejora", text: "¿Qué me recomiendas hacer esta semana para mejorar la plataforma?" },
  { label: "Clientes en riesgo", text: "¿Cuáles clientes están en riesgo de cancelar o necesitan seguimiento?" },
  { label: "Redactar email a cliente", text: "Redacta un email profesional para recordarle a un cliente que su plan vence pronto." },
];

const SEVERITY_STYLE: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  critical: { bg: "bg-red-50", border: "border-red-200", icon: "🚨", text: "text-red-700" },
  warning:  { bg: "bg-amber-50", border: "border-amber-200", icon: "⚠️", text: "text-amber-700" },
  info:     { bg: "bg-blue-50", border: "border-blue-200", icon: "ℹ️", text: "text-blue-700" },
};

export default function DirectorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [monitorReport, setMonitorReport] = useState<MonitorReport | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string; fix?: string; messageId?: string; checks?: Record<string, any> } | null>(null);
  const [tab, setTab] = useState<"chat" | "monitor">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadMonitor = useCallback(async () => {
    setMonitorLoading(true);
    try {
      const r = await fetch("/api/admin/director/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], action: "monitor" }),
      });
      if (r.ok) {
        const { report } = await r.json();
        setMonitorReport(report);
      }
    } catch {}
    setMonitorLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "monitor" && !monitorReport) {
      loadMonitor();
    }
  }, [tab, monitorReport, loadMonitor]);

  async function sendMessage(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch("/api/admin/director/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await r.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: "assistant", content: data.text, provider: data.provider }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${data.error ?? "Respuesta inválida"}` }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error de conexión: ${e.message}` }]);
    }
    setLoading(false);
  }

  async function sendReport() {
    setSendingEmail(true);
    setEmailSent(false);
    try {
      const r = await fetch("/api/admin/director/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], action: "send_report" }),
      });
      if (r.ok) setEmailSent(true);
    } catch {}
    setSendingEmail(false);
    setTimeout(() => setEmailSent(false), 4000);
  }

  async function testEmail() {
    setTestingEmail(true);
    setTestResult(null);
    try {
      const r = await fetch("/api/admin/test-email", { method: "POST" });
      const data = await r.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ ok: false, error: e.message });
    }
    setTestingEmail(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const criticals = monitorReport?.alerts.filter(a => a.severity === "critical").length ?? 0;
  const warnings = monitorReport?.alerts.filter(a => a.severity === "warning").length ?? 0;

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Director de Operaciones</h1>
              <p className="text-sm text-gray-500">Agente IA autónomo — monitorea, analiza y actúa</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <button
            onClick={testEmail}
            disabled={testingEmail}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {testingEmail ? "Probando..." : "🔧 Probar email"}
          </button>
          <button
            onClick={sendReport}
            disabled={sendingEmail}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              emailSent ? "bg-green-50 text-green-700 border-green-200" :
              "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            } disabled:opacity-60`}
          >
            {emailSent ? "✅ Enviado" : sendingEmail ? "Enviando..." : "📧 Enviar reporte"}
          </button>
        </div>
      </div>

      {/* Test email result */}
      {testResult && (
        <div className={`mb-4 p-4 rounded-xl border text-sm ${
          testResult.ok
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {testResult.ok ? (
            <p>✅ <strong>Email enviado correctamente.</strong> ID: <code className="text-xs">{testResult.messageId}</code></p>
          ) : (
            <div className="space-y-2">
              <p>❌ <strong>Error:</strong> {testResult.error}</p>
              {testResult.fix && (
                <p className="text-xs whitespace-pre-line opacity-80">💡 {testResult.fix}</p>
              )}
              {testResult.checks && (
                <div className="text-xs mt-2 space-y-0.5 opacity-70">
                  <p>RESEND_API_KEY: {testResult.checks.RESEND_API_KEY ? "✅ configurado" : "❌ falta"}</p>
                  <p>SYSTEM_EMAIL_FROM: <code>{testResult.checks.SYSTEM_EMAIL_FROM}</code></p>
                  <p>DIRECTOR_EMAIL: <code>{testResult.checks.DIRECTOR_EMAIL}</code></p>
                </div>
              )}
            </div>
          )}
          <button onClick={() => setTestResult(null)} className="mt-2 text-xs underline opacity-60 hover:opacity-100">Cerrar</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {(["chat", "monitor"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t === "chat" ? "💬 Chat con el Director" : `🔍 Monitor (${criticals + warnings > 0 ? `${criticals + warnings} alertas` : "OK"})`}
          </button>
        ))}
      </div>

      {/* ── CHAT TAB ── */}
      {tab === "chat" && (
        <div className="flex flex-col flex-1 min-h-0 gap-4">
          {/* Quick prompts */}
          {messages.length === 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Preguntas rápidas</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_PROMPTS.map(p => (
                  <button key={p.label} onClick={() => sendMessage(p.text)}
                    className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Welcome card */}
              <div className="mt-5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-5">
                <h3 className="font-bold text-gray-900 mb-2">¿Qué puedo hacer por ti?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                  {[
                    "📊 Analizar métricas y tendencias de la plataforma",
                    "🔍 Identificar sitios con problemas o en riesgo",
                    "💡 Dar recomendaciones de acción inmediata",
                    "✉️ Redactar emails o mensajes para clientes",
                    "📅 Resumir actividad y citas del día",
                    "🚨 Alertar sobre vencimientos y sitios inactivos",
                  ].map(item => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="mt-0.5 flex-shrink-0">{item.slice(0, 2)}</span>
                      <span>{item.slice(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-auto space-y-4 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    🤖
                  </div>
                )}
                <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                }`}>
                  {m.content}
                  {m.provider && m.role === "assistant" && (
                    <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-1.5">{m.provider}</p>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5 text-white font-bold">
                    S
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-3 items-end bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pregunta algo al Director... (Enter para enviar, Shift+Enter para nueva línea)"
              rows={1}
              className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 8l6-6 1.4 1.4L4.8 7H15v2H4.8l3.6 3.6L7 14z" transform="rotate(90 8 8) scale(-1,1) translate(-16 0)" />
                <path d="M14.5 8L8 1.5M14.5 8L8 14.5M14.5 8H1.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="text-xs text-gray-400 hover:text-gray-600 transition-colors self-center">
              Limpiar conversación
            </button>
          )}
        </div>
      )}

      {/* ── MONITOR TAB ── */}
      {tab === "monitor" && (
        <div className="flex-1 overflow-auto space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {monitorReport
                ? `Último análisis: ${new Date(monitorReport.generatedAt).toLocaleString("es")}`
                : "Cargando análisis..."}
            </p>
            <button onClick={loadMonitor} disabled={monitorLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
              {monitorLoading ? "Analizando..." : "🔄 Actualizar"}
            </button>
          </div>

          {monitorLoading && !monitorReport && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3 animate-pulse">🔍</div>
              <p>Analizando plataforma...</p>
            </div>
          )}

          {monitorReport && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Sitios activos", value: `${monitorReport.summary.activeSites}/${monitorReport.summary.totalSites}`, icon: "🌐" },
                  { label: "Citas hoy", value: monitorReport.summary.totalAppointmentsToday, icon: "📅" },
                  { label: "Pendientes", value: monitorReport.summary.pendingAppointments, icon: "⏳" },
                  { label: "Nuevos (7d)", value: `+${monitorReport.summary.newSitesLast7Days}`, icon: "🆕" },
                  { label: "Usuarios (7d)", value: `+${monitorReport.summary.newUsersLast7Days}`, icon: "👥" },
                  { label: "Alertas", value: monitorReport.alerts.length, icon: monitorReport.alerts.length > 0 ? "🚨" : "✅", color: monitorReport.alerts.length > 0 ? "text-red-600" : "text-green-600" },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <p className="text-xl mb-1">{item.icon}</p>
                    <p className={`text-lg font-bold ${item.color ?? "text-gray-900"}`}>{item.value}</p>
                    <p className="text-xs text-gray-400">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Alerts */}
              <div>
                <h2 className="font-bold text-gray-900 mb-3">
                  {monitorReport.alerts.length === 0 ? "✅ Sin alertas — Todo en orden" : `Alertas (${monitorReport.alerts.length})`}
                </h2>
                {monitorReport.alerts.length === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <p className="text-3xl mb-2">🎉</p>
                    <p className="text-green-700 font-semibold">La plataforma está funcionando perfectamente</p>
                    <p className="text-green-600 text-sm mt-1">No se detectaron problemas en este análisis</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {monitorReport.alerts.map((alert, i) => {
                      const style = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.info;
                      return (
                        <div key={i} className={`${style.bg} border ${style.border} rounded-xl p-4`}>
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0">{style.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm ${style.text} mb-1`}>{alert.title}</p>
                              <p className="text-sm text-gray-700 whitespace-pre-line">{alert.body}</p>
                              {alert.siteSlug && (
                                <a href={`/admin/sites`} className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline">
                                  Ver sitio en panel →
                                </a>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setTab("chat");
                                sendMessage(`Tengo esta alerta: "${alert.title}". ${alert.body} ¿Qué me recomiendas hacer?`);
                              }}
                              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              💬 Consultar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Send email CTA */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Enviar reporte por email</p>
                  <p className="text-xs text-gray-500 mt-0.5">Recibirás este análisis completo en jedimanbl@gmail.com</p>
                </div>
                <button onClick={sendReport} disabled={sendingEmail}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 ${
                    emailSent ? "bg-green-100 text-green-700 border border-green-200" :
                    "bg-blue-600 text-white hover:bg-blue-700"
                  }`}>
                  {emailSent ? "✅ Enviado" : sendingEmail ? "Enviando..." : "📧 Enviar ahora"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
