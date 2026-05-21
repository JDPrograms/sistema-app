import { prisma } from "./prisma";

export interface MonitorAlert {
  type: "expiry_warning" | "expiry_danger" | "expiry_grace" | "no_activity" | "high_cancellation" | "pending_overflow" | "new_sites" | "platform_summary";
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  siteId?: string;
  siteName?: string;
  siteSlug?: string;
}

export interface MonitorReport {
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

export async function runPlatformMonitor(): Promise<MonitorReport> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const [
    totalSites, activeSites,
    timedSites,
    todayAppointments,
    pendingAppointments,
    newSites7Days,
    newUsers7Days,
    recentCancelled, recentTotal,
    sitesNoActivity,
    highPendingSites,
  ] = await Promise.all([
    prisma.site.count(),
    prisma.site.count({ where: { isActive: true } }),
    prisma.site.findMany({
      where: { planType: "timed", isActive: true, expiresAt: { not: null } },
      select: { id: true, name: true, slug: true, expiresAt: true, planType: true },
    }),
    prisma.siteAppointment.count({ where: { date: today } }),
    prisma.siteAppointment.count({ where: { status: "pending" } }),
    prisma.site.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.siteUser.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.siteAppointment.count({ where: { status: "cancelled", date: { gte: thirtyDaysAgoStr } } }),
    prisma.siteAppointment.count({ where: { date: { gte: thirtyDaysAgoStr } } }),
    prisma.site.findMany({
      where: {
        isActive: true,
        appointments: { none: { date: { gte: thirtyDaysAgoStr } } },
        createdAt: { lt: thirtyDaysAgo },
      },
      select: { id: true, name: true, slug: true },
      take: 10,
    }),
    prisma.siteAppointment.groupBy({
      by: ["siteId"],
      where: { status: "pending" },
      _count: { siteId: true },
      having: { siteId: { _count: { gt: 10 } } },
    }),
  ]);

  const alerts: MonitorAlert[] = [];

  // ── Expiry checks ─────────────────────────────────────────────────────────
  for (const site of timedSites) {
    if (!site.expiresAt) continue;
    const diffDays = Math.ceil((site.expiresAt.getTime() - now.getTime()) / 86400000);
    const graceEnd = new Date(site.expiresAt.getTime() + 10 * 86400000);
    const graceDays = Math.ceil((graceEnd.getTime() - now.getTime()) / 86400000);

    if (diffDays <= 0 && graceDays > 0) {
      alerts.push({
        type: "expiry_grace",
        severity: "critical",
        title: `🚨 ${site.name} en período de gracia`,
        body: `El sitio "${site.name}" (/${site.slug}) está VENCIDO. Le quedan ${graceDays} día${graceDays === 1 ? "" : "s"} antes de desactivarse automáticamente.`,
        siteId: site.id, siteName: site.name, siteSlug: site.slug,
      });
    } else if (diffDays > 0 && diffDays <= 3) {
      alerts.push({
        type: "expiry_danger",
        severity: "critical",
        title: `⚠️ ${site.name} vence en ${diffDays} día${diffDays === 1 ? "" : "s"}`,
        body: `El sitio "${site.name}" (/${site.slug}) vence en ${diffDays} día${diffDays === 1 ? "" : "s"}. Contacta al cliente para renovar.`,
        siteId: site.id, siteName: site.name, siteSlug: site.slug,
      });
    } else if (diffDays > 3 && diffDays <= 7) {
      alerts.push({
        type: "expiry_warning",
        severity: "warning",
        title: `📅 ${site.name} vence en ${diffDays} días`,
        body: `El sitio "${site.name}" (/${site.slug}) vencerá en ${diffDays} días. Es buen momento para contactar al cliente.`,
        siteId: site.id, siteName: site.name, siteSlug: site.slug,
      });
    }
  }

  // ── No activity ───────────────────────────────────────────────────────────
  if (sitesNoActivity.length > 0) {
    alerts.push({
      type: "no_activity",
      severity: "warning",
      title: `😴 ${sitesNoActivity.length} sitio${sitesNoActivity.length > 1 ? "s" : ""} sin actividad en 30 días`,
      body: `Estos sitios llevan más de 30 días sin citas:\n${sitesNoActivity.map(s => `  • ${s.name} (/${s.slug})`).join("\n")}\n\nConsidere contactar a estos clientes para reactivación.`,
    });
  }

  // ── High cancellation rate ─────────────────────────────────────────────────
  if (recentTotal > 10) {
    const rate = Math.round((recentCancelled / recentTotal) * 100);
    if (rate >= 40) {
      alerts.push({
        type: "high_cancellation",
        severity: "warning",
        title: `📉 Tasa de cancelación alta: ${rate}%`,
        body: `En los últimos 30 días, ${recentCancelled} de ${recentTotal} citas fueron canceladas (${rate}%). La plataforma debería estar por debajo del 20%.`,
      });
    }
  }

  // ── Pending overflow ──────────────────────────────────────────────────────
  if (highPendingSites.length > 0 && pendingAppointments > 20) {
    alerts.push({
      type: "pending_overflow",
      severity: "warning",
      title: `⏳ ${pendingAppointments} citas pendientes sin confirmar`,
      body: `Hay ${pendingAppointments} citas en estado "pendiente" en toda la plataforma. Algunos administradores de sitio podrían no estar revisando su panel.`,
    });
  }

  // ── New sites (positive news) ─────────────────────────────────────────────
  if (newSites7Days > 0) {
    alerts.push({
      type: "new_sites",
      severity: "info",
      title: `🎉 ${newSites7Days} sitio${newSites7Days > 1 ? "s" : ""} nuevo${newSites7Days > 1 ? "s" : ""} esta semana`,
      body: `Se registraron ${newSites7Days} sitio${newSites7Days > 1 ? "s" : ""} nuevo${newSites7Days > 1 ? "s" : ""} en los últimos 7 días. También ${newUsers7Days} usuario${newUsers7Days > 1 ? "s" : ""} nuevo${newUsers7Days > 1 ? "s" : ""}.`,
    });
  }

  return {
    alerts,
    summary: {
      totalSites,
      activeSites,
      totalAppointmentsToday: todayAppointments,
      pendingAppointments,
      newSitesLast7Days: newSites7Days,
      newUsersLast7Days: newUsers7Days,
    },
    generatedAt: now.toISOString(),
  };
}

/** Build the HTML email body for a monitoring report */
export function buildMonitorEmailHtml(report: MonitorReport): string {
  const { alerts, summary, generatedAt } = report;
  const date = new Date(generatedAt).toLocaleString("es", { timeZone: "America/Santo_Domingo" });

  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  const warningAlerts = alerts.filter(a => a.severity === "warning");
  const infoAlerts = alerts.filter(a => a.severity === "info");

  const severityColor = { critical: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };
  const severityBg = { critical: "#fef2f2", warning: "#fffbeb", info: "#eff6ff" };

  const alertsHtml = alerts.length === 0
    ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;color:#15803d">
         ✅ <strong>Todo está en orden.</strong> No se detectaron problemas en la plataforma.
       </div>`
    : alerts.map(a => `
        <div style="background:${severityBg[a.severity]};border-left:4px solid ${severityColor[a.severity]};border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:12px">
          <p style="margin:0 0 6px 0;font-weight:700;color:${severityColor[a.severity]};font-size:15px">${a.title}</p>
          <p style="margin:0;color:#374151;font-size:14px;white-space:pre-line">${a.body}</p>
        </div>
      `).join("");

  return `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;background:#f9fafb">
  <div style="background:#1e3a5f;border-radius:12px 12px 0 0;padding:24px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px">🤖 Director de Operaciones</h1>
    <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px">Reporte automático de plataforma — ${date}</p>
  </div>

  <div style="background:#fff;border-radius:0 0 12px 12px;padding:24px;border:1px solid #e5e7eb;border-top:none">

    <!-- Summary -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
      ${[
        ["🌐", "Sitios activos", summary.activeSites + "/" + summary.totalSites],
        ["📅", "Citas hoy", String(summary.totalAppointmentsToday)],
        ["⏳", "Pendientes", String(summary.pendingAppointments)],
        ["🆕", "Nuevos (7d)", String(summary.newSitesLast7Days) + " sitios"],
        ["👥", "Usuarios (7d)", "+" + String(summary.newUsersLast7Days)],
        ["🚨", "Alertas", String(criticalAlerts.length) + " críticas"],
      ].map(([icon, label, val]) => `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center">
          <p style="margin:0;font-size:20px">${icon}</p>
          <p style="margin:4px 0 2px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">${label}</p>
          <p style="margin:0;font-weight:700;font-size:16px;color:#111827">${val}</p>
        </div>
      `).join("")}
    </div>

    <!-- Alert counts -->
    ${criticalAlerts.length + warningAlerts.length + infoAlerts.length > 0 ? `
    <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;gap:16px">
      ${criticalAlerts.length > 0 ? `<span style="color:#ef4444;font-weight:700">🚨 ${criticalAlerts.length} crítica${criticalAlerts.length > 1 ? "s" : ""}</span>` : ""}
      ${warningAlerts.length > 0 ? `<span style="color:#f59e0b;font-weight:700">⚠️ ${warningAlerts.length} advertencia${warningAlerts.length > 1 ? "s" : ""}</span>` : ""}
      ${infoAlerts.length > 0 ? `<span style="color:#3b82f6;font-weight:700">ℹ️ ${infoAlerts.length} informativa${infoAlerts.length > 1 ? "s" : ""}</span>` : ""}
    </div>` : ""}

    <!-- Alerts -->
    <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 12px">Alertas detectadas</h2>
    ${alertsHtml}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
      Este reporte fue generado automáticamente por el Director de Operaciones de <strong>Sistema de Sistemas</strong>.<br>
      Para ver el panel completo, accede a <strong>/admin</strong> en tu plataforma.
    </p>
  </div>
</body>
</html>`;
}
