import { Resend } from "resend";

const SYSTEM_FROM = process.env.SYSTEM_EMAIL_FROM || "noreply@sistema.app";

function getClient(apiKey?: string | null) {
  const key = apiKey || process.env.RESEND_API_KEY;
  if (!key) throw new Error("No hay API key de email configurada");
  return new Resend(key);
}

export async function sendEmail({
  apiKey,
  from,
  to,
  subject,
  html,
}: {
  apiKey?: string | null;
  from?: string | null;
  to: string | string[];
  subject: string;
  html: string;
}) {
  const resend = getClient(apiKey);
  const sender = from || SYSTEM_FROM;
  const res = await resend.emails.send({ from: sender, to, subject, html });
  if (res.error) throw new Error(res.error.message);
  return res;
}

// ── Templates ──────────────────────────────────────────────────────

export function appointmentConfirmationHtml(data: {
  clientName: string;
  serviceName?: string | null;
  staffName?: string | null;
  date: string;
  time: string;
  businessName: string;
  businessPhone?: string | null;
}) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#2563eb">✅ Cita confirmada</h2>
  <p>Hola <strong>${data.clientName}</strong>, tu cita ha sido registrada correctamente.</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    ${data.serviceName ? `<tr><td style="padding:8px 0;color:#6b7280;width:40%">Servicio</td><td style="padding:8px 0;font-weight:600">${data.serviceName}</td></tr>` : ""}
    ${data.staffName ? `<tr><td style="padding:8px 0;color:#6b7280">Profesional</td><td style="padding:8px 0;font-weight:600">${data.staffName}</td></tr>` : ""}
    <tr><td style="padding:8px 0;color:#6b7280">Fecha</td><td style="padding:8px 0;font-weight:600">${data.date}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Hora</td><td style="padding:8px 0;font-weight:600">${data.time}</td></tr>
  </table>
  ${data.businessPhone ? `<p style="color:#6b7280;font-size:14px">¿Necesitas cambiar tu cita? Contáctanos: <strong>${data.businessPhone}</strong></p>` : ""}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="color:#9ca3af;font-size:12px">${data.businessName}</p>
</body></html>`;
}

export function appointmentReminderHtml(data: {
  clientName: string;
  serviceName?: string | null;
  staffName?: string | null;
  date: string;
  time: string;
  businessName: string;
  businessPhone?: string | null;
}) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#d97706">⏰ Recordatorio de cita</h2>
  <p>Hola <strong>${data.clientName}</strong>, te recordamos que tienes una cita <strong>mañana</strong>.</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    ${data.serviceName ? `<tr><td style="padding:8px 0;color:#6b7280;width:40%">Servicio</td><td style="padding:8px 0;font-weight:600">${data.serviceName}</td></tr>` : ""}
    ${data.staffName ? `<tr><td style="padding:8px 0;color:#6b7280">Profesional</td><td style="padding:8px 0;font-weight:600">${data.staffName}</td></tr>` : ""}
    <tr><td style="padding:8px 0;color:#6b7280">Fecha</td><td style="padding:8px 0;font-weight:600">${data.date}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Hora</td><td style="padding:8px 0;font-weight:600">${data.time}</td></tr>
  </table>
  ${data.businessPhone ? `<p style="color:#6b7280;font-size:14px">¿Necesitas cancelar o cambiar? Llámanos: <strong>${data.businessPhone}</strong></p>` : ""}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="color:#9ca3af;font-size:12px">${data.businessName}</p>
</body></html>`;
}

export function invoiceEmailHtml(data: {
  clientName: string;
  invoiceNumber: string;
  total: number;
  dueDate?: string | null;
  businessName: string;
  portalUrl?: string | null;
}) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#2563eb">🧾 ${data.invoiceNumber}</h2>
  <p>Hola <strong>${data.clientName}</strong>, te enviamos tu factura.</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    <tr><td style="padding:8px 0;color:#6b7280;width:40%">Número</td><td style="padding:8px 0;font-weight:600">${data.invoiceNumber}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Total</td><td style="padding:8px 0;font-weight:600;font-size:18px">$${data.total.toFixed(2)}</td></tr>
    ${data.dueDate ? `<tr><td style="padding:8px 0;color:#6b7280">Vence</td><td style="padding:8px 0;font-weight:600">${data.dueDate}</td></tr>` : ""}
  </table>
  ${data.portalUrl ? `<a href="${data.portalUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Ver factura</a>` : ""}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="color:#9ca3af;font-size:12px">${data.businessName}</p>
</body></html>`;
}

export function verifyEmailHtml(data: { clientName: string; businessName: string; verifyUrl: string }) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#2563eb">✉️ Verifica tu cuenta</h2>
  <p>Hola <strong>${data.clientName}</strong>, gracias por registrarte en <strong>${data.businessName}</strong>.</p>
  <p>Haz clic en el botón para verificar tu correo:</p>
  <p><a href="${data.verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Verificar mi cuenta</a></p>
  <p style="color:#6b7280;font-size:13px">Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este correo.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="color:#9ca3af;font-size:12px">${data.businessName}</p>
</body></html>`;
}

export function welcomeEmailHtml(data: { clientName: string; businessName: string; portalUrl?: string | null }) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#2563eb">👋 Bienvenido a ${data.businessName}</h2>
  <p>Hola <strong>${data.clientName}</strong>, tu cuenta ha sido creada correctamente.</p>
  ${data.portalUrl ? `<p><a href="${data.portalUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Acceder a mi portal</a></p>` : ""}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="color:#9ca3af;font-size:12px">${data.businessName}</p>
</body></html>`;
}
