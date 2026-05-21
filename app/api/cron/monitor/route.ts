import { NextResponse } from "next/server";
import { runPlatformMonitor, buildMonitorEmailHtml } from "@/lib/monitor";
import { sendEmail } from "@/lib/email";

const DIRECTOR_EMAIL = process.env.DIRECTOR_EMAIL || "jedimanbl@gmail.com";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await runPlatformMonitor();

  const criticals = report.alerts.filter(a => a.severity === "critical").length;
  const warnings = report.alerts.filter(a => a.severity === "warning").length;
  const hasIssues = criticals + warnings > 0;

  const subject = hasIssues
    ? `🚨 [Sistema de Sistemas] ${criticals > 0 ? `${criticals} alerta${criticals > 1 ? "s" : ""} crítica${criticals > 1 ? "s" : ""}` : `${warnings} advertencia${warnings > 1 ? "s" : ""}`} — Director de Operaciones`
    : `✅ [Sistema de Sistemas] Todo en orden — Reporte diario`;

  try {
    await sendEmail({
      to: DIRECTOR_EMAIL,
      subject,
      html: buildMonitorEmailHtml(report),
    });
  } catch (e) {
    console.error("Monitor email failed:", e);
    return NextResponse.json({ ok: false, error: String(e), report }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    alertCount: report.alerts.length,
    criticals,
    warnings,
    emailSentTo: DIRECTOR_EMAIL,
    summary: report.summary,
  });
}

// Allow manual trigger from SuperAdmin
export async function POST(req: Request) {
  // Validate superadmin session for manual triggers
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const report = await runPlatformMonitor();

  // Only send email if requested
  const body = await req.json().catch(() => ({}));
  if (body.sendEmail !== false) {
    const criticals = report.alerts.filter(a => a.severity === "critical").length;
    const subject = `🔍 [Sistema de Sistemas] Reporte manual solicitado — ${report.alerts.length} alertas`;
    try {
      await sendEmail({
        to: DIRECTOR_EMAIL,
        subject,
        html: buildMonitorEmailHtml(report),
      });
    } catch (e) {
      console.error("Manual monitor email failed:", e);
    }
  }

  return NextResponse.json(report);
}
