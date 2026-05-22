import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { name, email, phone, business, plan, message } = await req.json() as {
    name: string; email: string; phone?: string;
    business: string; plan: string; message?: string;
  };

  if (!name?.trim() || !email?.trim() || !business?.trim() || !plan?.trim()) {
    return NextResponse.json({ error: "Campos requeridos incompletos" }, { status: 400 });
  }

  const adminEmail = process.env.DIRECTOR_EMAIL || process.env.SYSTEM_EMAIL_FROM;
  if (adminEmail) {
    try {
      await sendEmail({
        to: adminEmail,
        subject: `[Nuevo lead] ${name} — Plan ${plan}`,
        html: `<div style="font-family:sans-serif;max-width:520px;padding:24px;color:#1a1a1a">
          <h2 style="color:#2563eb">Nuevo lead desde la landing page</h2>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px 0;color:#6b7280;width:35%">Nombre</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0;font-weight:600">${email}</td></tr>
            ${phone ? `<tr><td style="padding:8px 0;color:#6b7280">Teléfono</td><td style="padding:8px 0;font-weight:600">${phone}</td></tr>` : ""}
            <tr><td style="padding:8px 0;color:#6b7280">Negocio</td><td style="padding:8px 0;font-weight:600">${business}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Plan</td><td style="padding:8px 0"><span style="background:#dbeafe;color:#1d4ed8;padding:2px 10px;border-radius:20px;font-weight:600">${plan}</span></td></tr>
            ${message ? `<tr><td style="padding:8px 0;color:#6b7280">Mensaje</td><td style="padding:8px 0">${message}</td></tr>` : ""}
          </table>
        </div>`,
      });
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ ok: true });
}
