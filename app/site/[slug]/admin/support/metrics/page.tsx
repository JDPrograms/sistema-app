"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────
interface MetricsSummary {
  allTime: number; total: number; today: number; thisWeek: number; thisMonth: number;
  byStatus: { bot: number; waiting: number; human: number; resolved: number };
  escalationRate: number; resolutionRate: number; botResolutionRate: number;
  avgWaitMinutes: number | null; avgResMinutes: number | null; rangeDays: number;
}
interface AgentStat { name: string; email: string; handled: number; resolved: number; isAvailable: boolean; isAlwaysOn: boolean; }
interface QueueStat { name: string; count: number; waiting: number; resolved: number; }
interface TrendPoint { date: string; total: number; escalated: number; resolved: number; }
interface PeakHour { hour: number; count: number; }
interface Metrics { summary: MetricsSummary; agents: AgentStat[]; queues: QueueStat[]; trend: TrendPoint[]; peakHours: PeakHour[]; }

interface ChatMsg { role: "user" | "assistant"; content: string; }
interface ReportSection { titulo: string; texto?: string; tabla?: { columnas: string[]; filas: string[][] }; }
interface Report { titulo: string; subtitulo?: string; fecha?: string; secciones: ReportSection[]; }

// ── SVG bar chart ──────────────────────────────────────────────────
function BarChart({ data, color = "#3b82f6", height = 80 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 100 / data.length;
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${Math.max(data.length * 28, 200)} ${height + 24}`} className="w-full" style={{ minWidth: `${data.length * 20}px` }}>
        {data.map((d, i) => {
          const barH = Math.max((d.value / max) * height, d.value > 0 ? 2 : 0);
          const x = i * (100 / data.length) * (Math.max(data.length * 28, 200) / 100);
          const barW = (Math.max(data.length * 28, 200) / data.length) * 0.7;
          return (
            <g key={i}>
              <rect x={x + (Math.max(data.length * 28, 200) / data.length) * 0.15} y={height - barH}
                width={barW} height={barH} rx="3" fill={color} opacity="0.85" />
              <text x={x + (Math.max(data.length * 28, 200) / data.length) * 0.5} y={height + 16}
                textAnchor="middle" fontSize="9" fill="#9ca3af">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── KPI card ───────────────────────────────────────────────────────
function KPICard({ label, value, sub, color = "blue", icon }: { label: string; value: string | number; sub?: string; color?: string; icon: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700", green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700", purple: "bg-purple-50 text-purple-700",
    gray: "bg-gray-50 text-gray-600", red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xl w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Parse @@REPORTE@@ block from AI response ───────────────────────
function parseReport(text: string): { clean: string; report: Report | null } {
  const match = text.match(/@@REPORTE@@([\s\S]*?)@@FINREPORTE@@/);
  if (!match) return { clean: text.trim(), report: null };
  try {
    // Strip trailing commas before ] or } to handle AI JSON quirks
    const sanitized = match[1].trim().replace(/,(\s*[}\]])/g, "$1");
    const report = JSON.parse(sanitized) as Report;
    const clean = text.replace(/@@REPORTE@@[\s\S]*?@@FINREPORTE@@/, "").trim();
    return { clean, report };
  } catch { return { clean: text.trim(), report: null }; }
}

// ── PDF generation (client-side with jsPDF) ────────────────────────
async function generatePDF(report: Report, siteName: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;

  // Header band
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(report.titulo, margin, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (report.subtitulo) doc.text(report.subtitulo, margin, 20);
  doc.text(`${siteName} • Generado: ${report.fecha || new Date().toLocaleDateString("es")}`, margin, 26);
  y = 38;

  doc.setTextColor(30, 30, 30);

  report.secciones.forEach((sec, idx) => {
    // Check if page break needed
    if (y > 250) { doc.addPage(); y = margin; }

    // Section title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text(sec.titulo, margin, y);
    y += 5;

    // Section rule
    doc.setDrawColor(219, 234, 254);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    doc.setTextColor(50, 50, 50);

    // Text block
    if (sec.texto) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(sec.texto, pageW - margin * 2) as string[];
      lines.forEach((line) => {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 5;
      });
      y += 2;
    }

    // Table
    if (sec.tabla) {
      autoTable(doc, {
        head: [sec.tabla.columnas],
        body: sec.tabla.filas,
        startY: y,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [239, 246, 255] },
        tableLineColor: [219, 234, 254],
        tableLineWidth: 0.3,
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    y += 4;
  });

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${totalPages} — ${siteName}`, pageW / 2, 290, { align: "center" });
  }

  const filename = `${report.titulo.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}

// ── Main page ──────────────────────────────────────────────────────
export default function MetricsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingReport, setPendingReport] = useState<Report | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const loadMetrics = useCallback(async (days: number) => {
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/support/metrics?days=${days}`);
    if (res.ok) setMetrics(await res.json());
    setLoading(false);
  }, [slug]);

  useEffect(() => { loadMetrics(rangeDays); }, [rangeDays, loadMetrics]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  // Initial AI greeting
  useEffect(() => {
    if (chatMsgs.length === 0) {
      setChatMsgs([{
        role: "assistant",
        content: "Hola, soy tu analista de métricas de soporte. Puedo responderte preguntas sobre las métricas, identificar áreas de mejora y generar reportes PDF personalizados. ¿Qué quieres analizar?",
      }]);
    }
  }, []);

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading || !metrics) return;
    setChatInput("");
    const newMsgs: ChatMsg[] = [...chatMsgs, { role: "user", content: text }];
    setChatMsgs(newMsgs);
    setChatLoading(true);

    try {
      const res = await fetch(`/api/site/${slug}/support/metrics/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs.filter((m) => m.role !== "assistant" || newMsgs.indexOf(m) > 0), metrics }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const { clean, report } = parseReport(data.text);
      setChatMsgs((prev) => [...prev, { role: "assistant", content: clean || data.text }]);
      if (report) setPendingReport(report);
    } catch (e: any) {
      setChatMsgs((prev) => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    }
    setChatLoading(false);
  }

  async function handleGeneratePDF(report: Report) {
    setGeneratingPDF(true);
    try {
      await generatePDF(report, slug);
    } finally {
      setGeneratingPDF(false);
      setPendingReport(null);
    }
  }

  // Trend data for chart (last 14 days)
  const trendData = metrics?.trend.slice(-14).map((t) => ({
    label: t.date.slice(5), // MM-DD
    value: t.total,
  })) ?? [];

  const peakData = metrics?.peakHours
    .filter((h) => h.count > 0)
    .map((h) => ({ label: `${h.hour}h`, value: h.count })) ?? [];

  const s = metrics?.summary;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/site/${slug}/admin/support`}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm">← Soporte</Link>
          <span className="text-gray-200">|</span>
          <h1 className="text-lg font-bold text-gray-900">📊 Métricas de Soporte</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Período:</span>
          {([7, 14, 30, 90] as const).map((d) => (
            <button key={d} onClick={() => setRangeDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${rangeDays === d ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* ── Metrics area ───────────────────────────────────────── */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">Calculando métricas...</div>
          ) : !s ? (
            <div className="text-center py-12 text-gray-400">No se pudieron cargar las métricas.</div>
          ) : (
            <>
              {/* KPI grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard icon="💬" label="Conversaciones" value={s.total} sub={`Período de ${s.rangeDays} días`} color="blue" />
                <KPICard icon="📅" label="Hoy" value={s.today} sub={`Semana: ${s.thisWeek} | Mes: ${s.thisMonth}`} color="purple" />
                <KPICard icon="🚀" label="Tasa de escalación" value={`${s.escalationRate}%`} sub="Clientes que pidieron humano" color="amber" />
                <KPICard icon="✅" label="Tasa de resolución" value={`${s.resolutionRate}%`} sub="De los escalados, cuántos se cerraron" color="green" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard icon="🤖" label="Autoservicio bot" value={`${s.botResolutionRate}%`} sub="Resuelto sin agente humano" color="blue" />
                <KPICard icon="⏱️" label="Espera promedio" value={s.avgWaitMinutes != null ? `${s.avgWaitMinutes} min` : "—"} sub="Solicitud → agente asignado" color="amber" />
                <KPICard icon="🏁" label="Resolución promedio" value={s.avgResMinutes != null ? `${s.avgResMinutes} min` : "—"} sub="Desde inicio hasta cierre" color="purple" />
                <KPICard icon="🗂️" label="Total histórico" value={s.allTime} sub="Todas las conversaciones" color="gray" />
              </div>

              {/* Status distribution */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-bold text-gray-900 mb-4">Distribución por estado</h2>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Bot", count: s.byStatus.bot, color: "bg-blue-400" },
                    { label: "Esperando", count: s.byStatus.waiting, color: "bg-amber-400" },
                    { label: "En vivo", count: s.byStatus.human, color: "bg-green-400" },
                    { label: "Resuelto", count: s.byStatus.resolved, color: "bg-gray-300" },
                  ].map((item) => {
                    const pct = s.total > 0 ? Math.round((item.count / s.total) * 100) : 0;
                    return (
                      <div key={item.label} className="text-center">
                        <div className="text-2xl font-black text-gray-900">{item.count}</div>
                        <div className="text-xs text-gray-400 mb-2">{item.label}</div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trend + Peak hours */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="font-bold text-gray-900 mb-4">Tendencia diaria (últimos 14 días)</h2>
                  {trendData.every((d) => d.value === 0) ? (
                    <p className="text-sm text-gray-400 text-center py-8">Sin datos en este período</p>
                  ) : (
                    <BarChart data={trendData} color="#3b82f6" height={80} />
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="font-bold text-gray-900 mb-4">Horas pico de actividad</h2>
                  {peakData.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Sin datos suficientes</p>
                  ) : (
                    <BarChart data={peakData.sort((a, b) => Number(a.label) - Number(b.label))} color="#8b5cf6" height={80} />
                  )}
                </div>
              </div>

              {/* Queues table */}
              {metrics!.queues.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Rendimiento por cola</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {["Cola", "Total", "Esperando", "Resueltos", "Tasa resolución"].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {metrics!.queues.map((q) => {
                          const rate = q.count > 0 ? Math.round((q.resolved / q.count) * 100) : 0;
                          return (
                            <tr key={q.name} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900">{q.name}</td>
                              <td className="px-4 py-3 text-gray-600">{q.count}</td>
                              <td className="px-4 py-3">
                                <span className={`font-medium ${q.waiting > 0 ? "text-amber-600" : "text-gray-400"}`}>{q.waiting}</span>
                              </td>
                              <td className="px-4 py-3 text-green-600 font-medium">{q.resolved}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-20">
                                    <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${rate}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-500">{rate}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Agents table */}
              {metrics!.agents.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Rendimiento por agente</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {["Agente", "Atendidas", "Resueltas", "Efectividad", "Estado"].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {metrics!.agents.sort((a, b) => b.handled - a.handled).map((a) => {
                          const eff = a.handled > 0 ? Math.round((a.resolved / a.handled) * 100) : 0;
                          return (
                            <tr key={a.email} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                    {a.name[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 text-xs">{a.name}</p>
                                    {a.isAlwaysOn && <p className="text-xs text-blue-500">Siempre activo</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-900">{a.handled}</td>
                              <td className="px-4 py-3 text-green-600 font-medium">{a.resolved}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-20">
                                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${eff}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-500">{eff}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                                  {a.isAvailable ? "Disponible" : "No disp."}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── AI Chat panel ──────────────────────────────────────── */}
        <div className="w-80 flex-shrink-0 border-l border-gray-100 flex flex-col bg-white">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <p className="text-sm font-bold text-gray-900">Analista IA</p>
              <p className="text-xs text-gray-400">Pregunta sobre métricas o pide un reporte</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {chatMsgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm text-xs text-gray-500 animate-pulse">
                  Analizando métricas...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Pending report download */}
          {pendingReport && (
            <div className="mx-3 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs font-bold text-blue-800 mb-0.5">📄 Reporte listo</p>
              <p className="text-xs text-blue-600 mb-2">{pendingReport.titulo}</p>
              <div className="flex gap-2">
                <button onClick={() => handleGeneratePDF(pendingReport)} disabled={generatingPDF}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-1.5 rounded-lg text-xs font-bold transition-colors">
                  {generatingPDF ? "Generando..." : "⬇ Descargar PDF"}
                </button>
                <button onClick={() => setPendingReport(null)}
                  className="text-blue-400 hover:text-blue-600 px-2 text-xs">✕</button>
              </div>
            </div>
          )}

          {/* Suggested prompts */}
          {chatMsgs.length <= 1 && (
            <div className="px-3 pb-2 flex flex-col gap-1.5">
              {[
                "¿Cómo está el rendimiento esta semana?",
                "Genera un reporte completo de métricas",
                "¿Qué cola tiene más carga?",
                "Genera un reporte de rendimiento de agentes",
              ].map((s) => (
                <button key={s} onClick={() => { setChatInput(s); }}
                  className="text-left text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors border border-blue-100">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
              placeholder="Pregunta sobre métricas..."
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={chatLoading || loading}
            />
            <button onClick={sendChat} disabled={chatLoading || loading || !chatInput.trim() || !metrics}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-medium transition-colors">
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
