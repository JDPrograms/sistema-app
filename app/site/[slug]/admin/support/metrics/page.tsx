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

// ── SVG bar chart ──────────────────────────────────────────────────
function BarChart({ data, color = "#3b82f6", height = 80 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const totalW = Math.max(data.length * 28, 200);
  const colW = totalW / data.length;
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${height + 24}`} className="w-full" style={{ minWidth: `${data.length * 20}px` }}>
        {data.map((d, i) => {
          const barH = Math.max((d.value / max) * height, d.value > 0 ? 2 : 0);
          return (
            <g key={i}>
              <rect x={i * colW + colW * 0.15} y={height - barH} width={colW * 0.7} height={barH} rx="3" fill={color} opacity="0.85" />
              <text x={i * colW + colW * 0.5} y={height + 16} textAnchor="middle" fontSize="9" fill="#9ca3af">{d.label}</text>
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
    gray: "bg-gray-50 text-gray-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="mb-3">
        <span className={`text-xl w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── CSV export ─────────────────────────────────────────────────────
function downloadCSV(metrics: Metrics, slug: string, rangeDays: number) {
  const s = metrics.summary;
  const date = new Date().toISOString().split("T")[0];
  const rows: string[] = [];

  rows.push("MÉTRICAS DE SOPORTE — " + slug.toUpperCase());
  rows.push(`Período analizado,${rangeDays} días`);
  rows.push(`Generado,${date}`);
  rows.push("");

  rows.push("RESUMEN GENERAL");
  rows.push("Métrica,Valor");
  rows.push(`Total conversaciones (período),${s.total}`);
  rows.push(`Hoy,${s.today}`);
  rows.push(`Esta semana,${s.thisWeek}`);
  rows.push(`Este mes,${s.thisMonth}`);
  rows.push(`Total histórico,${s.allTime}`);
  rows.push(`Tasa de escalación,${s.escalationRate}%`);
  rows.push(`Tasa de resolución,${s.resolutionRate}%`);
  rows.push(`Autoservicio bot,${s.botResolutionRate}%`);
  rows.push(`Tiempo promedio de espera,${s.avgWaitMinutes != null ? s.avgWaitMinutes + " min" : "Sin datos"}`);
  rows.push(`Tiempo promedio de resolución,${s.avgResMinutes != null ? s.avgResMinutes + " min" : "Sin datos"}`);
  rows.push("");

  rows.push("DISTRIBUCIÓN POR ESTADO");
  rows.push("Estado,Cantidad");
  rows.push(`Bot,${s.byStatus.bot}`);
  rows.push(`Esperando agente,${s.byStatus.waiting}`);
  rows.push(`Atención humana,${s.byStatus.human}`);
  rows.push(`Resueltos,${s.byStatus.resolved}`);
  rows.push("");

  if (metrics.queues.length > 0) {
    rows.push("COLAS");
    rows.push("Cola,Total,Esperando,Resueltos,Tasa resolución");
    metrics.queues.forEach((q) => {
      const rate = q.count > 0 ? Math.round((q.resolved / q.count) * 100) : 0;
      rows.push(`${q.name},${q.count},${q.waiting},${q.resolved},${rate}%`);
    });
    rows.push("");
  }

  if (metrics.agents.length > 0) {
    rows.push("AGENTES");
    rows.push("Agente,Email,Atendidas,Resueltas,Efectividad,Disponible,Siempre activo");
    metrics.agents.forEach((a) => {
      const eff = a.handled > 0 ? Math.round((a.resolved / a.handled) * 100) : 0;
      rows.push(`${a.name},${a.email},${a.handled},${a.resolved},${eff}%,${a.isAvailable ? "Sí" : "No"},${a.isAlwaysOn ? "Sí" : "No"}`);
    });
    rows.push("");
  }

  rows.push("TENDENCIA DIARIA");
  rows.push("Fecha,Total,Escalados,Resueltos");
  metrics.trend.forEach((t) => rows.push(`${t.date},${t.total},${t.escalated},${t.resolved}`));
  rows.push("");

  rows.push("HORAS PICO");
  rows.push("Hora,Conversaciones");
  metrics.peakHours.filter((h) => h.count > 0).sort((a, b) => a.hour - b.hour)
    .forEach((h) => rows.push(`${h.hour}:00,${h.count}`));

  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `metricas_soporte_${slug}_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF export ─────────────────────────────────────────────────────
async function downloadPDF(metrics: Metrics, slug: string, rangeDays: number) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const s = metrics.summary;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const M = 16;
  const date = new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
  let y = 0;

  // ── Header band ──────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text("Reporte de Soporte", M, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${slug} · Últimos ${rangeDays} días · Generado: ${date}`, M, 21);
  doc.text(`Total histórico: ${s.allTime} conversaciones`, M, 27);
  y = 40;

  const sectionTitle = (title: string) => {
    if (y > 255) { doc.addPage(); y = M; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text(title, M, y);
    y += 3;
    doc.setDrawColor(219, 234, 254);
    doc.setLineWidth(0.4);
    doc.line(M, y, pageW - M, y);
    y += 6;
    doc.setTextColor(40, 40, 40);
  };

  // ── KPI summary ──────────────────────────────────────────────────
  sectionTitle("Resumen del período");
  autoTable(doc, {
    head: [["Métrica", "Valor", "Métrica", "Valor"]],
    body: [
      ["Conversaciones totales", String(s.total), "Hoy", String(s.today)],
      ["Esta semana", String(s.thisWeek), "Este mes", String(s.thisMonth)],
      ["Tasa de escalación", `${s.escalationRate}%`, "Tasa de resolución", `${s.resolutionRate}%`],
      ["Autoservicio (bot)", `${s.botResolutionRate}%`, "Espera promedio", s.avgWaitMinutes != null ? `${s.avgWaitMinutes} min` : "—"],
    ],
    startY: y,
    margin: { left: M, right: M },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    columnStyles: { 0: { fontStyle: "bold", textColor: [60, 60, 60] }, 2: { fontStyle: "bold", textColor: [60, 60, 60] } },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Status distribution ──────────────────────────────────────────
  sectionTitle("Distribución por estado");
  autoTable(doc, {
    head: [["Estado", "Cantidad", "% del total"]],
    body: [
      ["Bot (sin escalar)", String(s.byStatus.bot), s.total > 0 ? `${Math.round((s.byStatus.bot / s.total) * 100)}%` : "0%"],
      ["Esperando agente", String(s.byStatus.waiting), s.total > 0 ? `${Math.round((s.byStatus.waiting / s.total) * 100)}%` : "0%"],
      ["Atención humana activa", String(s.byStatus.human), s.total > 0 ? `${Math.round((s.byStatus.human / s.total) * 100)}%` : "0%"],
      ["Resueltos", String(s.byStatus.resolved), s.total > 0 ? `${Math.round((s.byStatus.resolved / s.total) * 100)}%` : "0%"],
    ],
    startY: y,
    margin: { left: M, right: M },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [239, 246, 255] },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Queues ───────────────────────────────────────────────────────
  if (metrics.queues.length > 0) {
    sectionTitle("Rendimiento por cola");
    autoTable(doc, {
      head: [["Cola", "Total", "Esperando", "Resueltos", "Tasa resolución"]],
      body: metrics.queues.map((q) => {
        const rate = q.count > 0 ? Math.round((q.resolved / q.count) * 100) : 0;
        return [q.name, String(q.count), String(q.waiting), String(q.resolved), `${rate}%`];
      }),
      startY: y,
      margin: { left: M, right: M },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [239, 246, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Agents ───────────────────────────────────────────────────────
  if (metrics.agents.length > 0) {
    sectionTitle("Rendimiento por agente");
    autoTable(doc, {
      head: [["Agente", "Atendidas", "Resueltas", "Efectividad", "Estado"]],
      body: metrics.agents.sort((a, b) => b.handled - a.handled).map((a) => {
        const eff = a.handled > 0 ? Math.round((a.resolved / a.handled) * 100) : 0;
        return [a.name, String(a.handled), String(a.resolved), `${eff}%`, a.isAvailable ? "Disponible" : "No disponible"];
      }),
      startY: y,
      margin: { left: M, right: M },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [239, 246, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Trend (last 14 days) ─────────────────────────────────────────
  const trendSlice = metrics.trend.slice(-14).filter((t) => t.total > 0);
  if (trendSlice.length > 0) {
    sectionTitle("Tendencia diaria (últimos 14 días)");
    autoTable(doc, {
      head: [["Fecha", "Total", "Escalados", "Resueltos", "Tasa escalación"]],
      body: trendSlice.map((t) => {
        const rate = t.total > 0 ? Math.round((t.escalated / t.total) * 100) : 0;
        return [t.date, String(t.total), String(t.escalated), String(t.resolved), `${rate}%`];
      }),
      startY: y,
      margin: { left: M, right: M },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [239, 246, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Peak hours ───────────────────────────────────────────────────
  const topHours = metrics.peakHours.filter((h) => h.count > 0).sort((a, b) => b.count - a.count).slice(0, 10);
  if (topHours.length > 0) {
    sectionTitle("Horas de mayor actividad");
    autoTable(doc, {
      head: [["Hora", "Conversaciones", "% del total"]],
      body: topHours.map((h) => {
        const pct = s.total > 0 ? Math.round((h.count / s.total) * 100) : 0;
        return [`${h.hour}:00 — ${h.hour + 1}:00`, String(h.count), `${pct}%`];
      }),
      startY: y,
      margin: { left: M, right: M },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [239, 246, 255] },
    });
  }

  // ── Footer on all pages ──────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 160);
    doc.text(`Página ${i} de ${totalPages}  ·  ${slug}  ·  ${date}`, pageW / 2, 290, { align: "center" });
  }

  doc.save(`metricas_soporte_${slug}_${new Date().toISOString().split("T")[0]}.pdf`);
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
  const [downloading, setDownloading] = useState<"pdf" | "csv" | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const loadMetrics = useCallback(async (days: number) => {
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/support/metrics?days=${days}`);
    if (res.ok) setMetrics(await res.json());
    setLoading(false);
  }, [slug]);

  useEffect(() => { loadMetrics(rangeDays); }, [rangeDays, loadMetrics]);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  useEffect(() => {
    if (chatMsgs.length === 0) {
      setChatMsgs([{ role: "assistant", content: "Hola, soy tu analista de métricas. Puedo responder preguntas sobre las conversaciones, agentes, colas y tendencias. ¿Qué quieres saber?" }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading || !metrics) return;
    setChatInput("");
    const updated: ChatMsg[] = [...chatMsgs, { role: "user", content: text }];
    setChatMsgs(updated);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/site/${slug}/support/metrics/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, metrics }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setChatMsgs((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (e: any) {
      setChatMsgs((prev) => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    }
    setChatLoading(false);
  }

  async function handlePDF() {
    if (!metrics) return;
    setDownloading("pdf");
    try { await downloadPDF(metrics, slug, rangeDays); } finally { setDownloading(null); }
  }

  function handleCSV() {
    if (!metrics) return;
    setDownloading("csv");
    downloadCSV(metrics, slug, rangeDays);
    setDownloading(null);
  }

  const s = metrics?.summary;
  const trendData = metrics?.trend.slice(-14).map((t) => ({ label: t.date.slice(5), value: t.total })) ?? [];
  const peakData = metrics?.peakHours.filter((h) => h.count > 0).map((h) => ({ label: `${h.hour}h`, value: h.count })) ?? [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/site/${slug}/admin/support`} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">← Soporte</Link>
          <span className="text-gray-200">|</span>
          <h1 className="text-lg font-bold text-gray-900">📊 Métricas de Soporte</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {([7, 14, 30, 90] as const).map((d) => (
              <button key={d} onClick={() => setRangeDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${rangeDays === d ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                {d}d
              </button>
            ))}
          </div>
          {/* Download buttons */}
          <button onClick={handleCSV} disabled={!metrics || downloading === "csv"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-green-400 hover:text-green-700 text-gray-600 text-xs font-medium transition-colors disabled:opacity-40">
            {downloading === "csv" ? "..." : "⬇"} CSV
          </button>
          <button onClick={handlePDF} disabled={!metrics || downloading === "pdf"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium transition-colors">
            {downloading === "pdf" ? "Generando..." : "⬇ PDF"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* ── Metrics area ──────────────────────────────────────── */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">Calculando métricas...</div>
          ) : !s ? (
            <div className="text-center py-12 text-gray-400">No se pudieron cargar las métricas.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard icon="💬" label="Conversaciones" value={s.total} sub={`Últimos ${s.rangeDays} días`} color="blue" />
                <KPICard icon="📅" label="Hoy" value={s.today} sub={`Semana: ${s.thisWeek} · Mes: ${s.thisMonth}`} color="purple" />
                <KPICard icon="🚀" label="Tasa de escalación" value={`${s.escalationRate}%`} sub="Clientes que pidieron agente" color="amber" />
                <KPICard icon="✅" label="Tasa de resolución" value={`${s.resolutionRate}%`} sub="De escalados cerrados" color="green" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard icon="🤖" label="Autoservicio bot" value={`${s.botResolutionRate}%`} sub="Sin intervención humana" color="blue" />
                <KPICard icon="⏱️" label="Espera promedio" value={s.avgWaitMinutes != null ? `${s.avgWaitMinutes} min` : "—"} sub="Solicitud → agente asignado" color="amber" />
                <KPICard icon="🏁" label="Resolución promedio" value={s.avgResMinutes != null ? `${s.avgResMinutes} min` : "—"} sub="Inicio → cierre" color="purple" />
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

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="font-bold text-gray-900 mb-4">Tendencia diaria (últimos 14 días)</h2>
                  {trendData.every((d) => d.value === 0)
                    ? <p className="text-sm text-gray-400 text-center py-8">Sin datos en este período</p>
                    : <BarChart data={trendData} color="#3b82f6" height={80} />}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="font-bold text-gray-900 mb-4">Horas pico de actividad</h2>
                  {peakData.length === 0
                    ? <p className="text-sm text-gray-400 text-center py-8">Sin datos suficientes</p>
                    : <BarChart data={peakData.sort((a, b) => Number(a.label) - Number(b.label))} color="#8b5cf6" height={80} />}
                </div>
              </div>

              {/* Queues */}
              {metrics!.queues.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Rendimiento por cola</h2>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>{["Cola", "Total", "Esperando", "Resueltos", "Tasa resolución"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {metrics!.queues.map((q) => {
                        const rate = q.count > 0 ? Math.round((q.resolved / q.count) * 100) : 0;
                        return (
                          <tr key={q.name} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{q.name}</td>
                            <td className="px-4 py-3 text-gray-600">{q.count}</td>
                            <td className="px-4 py-3"><span className={q.waiting > 0 ? "text-amber-600 font-medium" : "text-gray-400"}>{q.waiting}</span></td>
                            <td className="px-4 py-3 text-green-600 font-medium">{q.resolved}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-20"><div className="h-1.5 rounded-full bg-green-500" style={{ width: `${rate}%` }} /></div>
                                <span className="text-xs text-gray-500">{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Agents */}
              {metrics!.agents.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Rendimiento por agente</h2>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>{["Agente", "Atendidas", "Resueltas", "Efectividad", "Estado"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {metrics!.agents.sort((a, b) => b.handled - a.handled).map((a) => {
                        const eff = a.handled > 0 ? Math.round((a.resolved / a.handled) * 100) : 0;
                        return (
                          <tr key={a.email} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">{a.name[0]}</div>
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
                                <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-20"><div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${eff}%` }} /></div>
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
              )}
            </>
          )}
        </div>

        {/* ── AI Chat panel ──────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 border-l border-gray-100 flex flex-col bg-white">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <p className="text-sm font-bold text-gray-900">Analista IA</p>
              <p className="text-xs text-gray-400">Pregunta sobre las métricas</p>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-3">
            {chatMsgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  m.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm text-xs text-gray-400 animate-pulse">Analizando...</div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick prompts */}
          {chatMsgs.length <= 1 && (
            <div className="px-3 pb-2 space-y-1.5">
              {[
                "¿Cómo está el rendimiento esta semana?",
                "¿Qué agente atiende más conversaciones?",
                "¿Cuál es la hora con más actividad?",
                "¿Qué cola tiene más carga?",
              ].map((p) => (
                <button key={p} onClick={() => setChatInput(p)}
                  className="w-full text-left text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors border border-blue-100">
                  {p}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
              placeholder="Pregunta algo..."
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
