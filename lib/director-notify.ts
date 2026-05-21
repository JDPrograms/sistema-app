/**
 * Director de Operaciones — Real-time event notifications
 *
 * Sends email to the director when important events happen on the platform.
 * Uses SystemConfig as a lightweight deduplication store so we don't flood
 * the inbox with repeat alerts within the same cooldown window.
 */
import { prisma } from "./prisma";
import { sendEmail } from "./email";

const DIRECTOR_EMAIL = process.env.DIRECTOR_EMAIL || "jedimanbl@gmail.com";

export type DirectorEventType =
  | "site_created"
  | "site_deactivated"
  | "site_deleted"
  | "site_reactivated"
  | "appointment_cancelled_spike"
  | "expiry_manual";

interface NotifyPayload {
  event: DirectorEventType;
  title: string;
  body: string;
  /** Cooldown in minutes before the same event type fires again. Default 30. */
  cooldownMinutes?: number;
  /** Key suffix for dedup — use siteId to deduplicate per-site. */
  dedupKey?: string;
}

/** Check dedup and send email. Fire-and-forget safe (won't throw). */
export async function notifyDirector(payload: NotifyPayload): Promise<void> {
  const { event, title, body, cooldownMinutes = 30, dedupKey = "global" } = payload;
  const configKey = `director_event:${event}:${dedupKey}`;

  try {
    // ── Cooldown check via SystemConfig ───────────────────────────────────
    const existing = await prisma.systemConfig.findUnique({ where: { key: configKey } });
    if (existing) {
      const lastSent = new Date(existing.value);
      const minutesAgo = (Date.now() - lastSent.getTime()) / 60000;
      if (minutesAgo < cooldownMinutes) return; // still in cooldown
    }

    // ── Update dedup timestamp ─────────────────────────────────────────────
    await prisma.systemConfig.upsert({
      where: { key: configKey },
      update: { value: new Date().toISOString() },
      create: { key: configKey, value: new Date().toISOString() },
    });

    // ── Send email ─────────────────────────────────────────────────────────
    await sendEmail({
      to: DIRECTOR_EMAIL,
      subject: `🤖 Director: ${title}`,
      html: buildEventEmailHtml({ title, body, event }),
    });
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    if (msg.includes("API key")) {
      console.error("[director-notify] RESEND_API_KEY no configurado — revisa tus variables de entorno");
    } else {
      console.error("[director-notify] Failed:", msg);
    }
  }
}

function buildEventEmailHtml({ title, body, event }: { title: string; body: string; event: DirectorEventType }) {
  const now = new Date().toLocaleString("es", { timeZone: "America/Santo_Domingo" });

  const eventColors: Record<DirectorEventType, { bg: string; border: string; icon: string }> = {
    site_created:                 { bg: "#f0fdf4", border: "#86efac", icon: "🎉" },
    site_deactivated:             { bg: "#fef2f2", border: "#fca5a5", icon: "🔴" },
    site_deleted:                 { bg: "#fef2f2", border: "#ef4444", icon: "🗑️" },
    site_reactivated:             { bg: "#eff6ff", border: "#93c5fd", icon: "✅" },
    appointment_cancelled_spike:  { bg: "#fffbeb", border: "#fde68a", icon: "📉" },
    expiry_manual:                { bg: "#fef3c7", border: "#fcd34d", icon: "⏰" },
  };

  const style = eventColors[event] ?? { bg: "#f8fafc", border: "#e2e8f0", icon: "ℹ️" };

  return `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827;background:#f9fafb">
  <div style="background:#1e3a5f;border-radius:12px 12px 0 0;padding:20px 24px;display:flex;align-items:center;gap:12px">
    <span style="font-size:24px">🤖</span>
    <div>
      <p style="color:#fff;margin:0;font-weight:700;font-size:16px">Director de Operaciones</p>
      <p style="color:rgba(255,255,255,0.6);margin:2px 0 0;font-size:12px">Alerta en tiempo real — ${now}</p>
    </div>
  </div>
  <div style="background:#fff;border-radius:0 0 12px 12px;padding:24px;border:1px solid #e5e7eb;border-top:none">
    <div style="background:${style.bg};border:1px solid ${style.border};border-radius:10px;padding:16px 20px;margin-bottom:20px">
      <p style="margin:0 0 8px;font-weight:700;font-size:17px;color:#111827">${style.icon} ${title}</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;white-space:pre-line">${body}</p>
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
      Este mensaje fue enviado automáticamente por el <strong>Director de Operaciones</strong> de Sistema de Sistemas.<br>
      Accede a <strong>/admin</strong> para gestionar.
    </p>
  </div>
</body>
</html>`;
}
