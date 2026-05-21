import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ip = getClientIp(req);
  if (!rateLimit(`contact:${ip}`, 3, 60_000)) {
    return NextResponse.json({ error: "Demasiados envíos. Intenta en un momento." }, { status: 429 });
  }

  const site = await prisma.site.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, email: true, emailApiKey: true, emailFrom: true },
  });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });

  const { name, email, phone, message } = await req.json();
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Nombre, email y mensaje son requeridos" }, { status: 400 });
  }

  // Notify site via email if configured
  const recipient = site.email;
  if (recipient) {
    sendEmail({
      apiKey: site.emailApiKey,
      from: site.emailFrom,
      to: recipient,
      subject: `Nuevo mensaje de contacto — ${site.name}`,
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
        <h2 style="color:#2563eb">📬 Nuevo mensaje de contacto</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#6b7280;width:30%">Nombre</td><td style="padding:8px 0;font-weight:600">${name.trim()}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0;font-weight:600">${email.trim()}</td></tr>
          ${phone ? `<tr><td style="padding:8px 0;color:#6b7280">Teléfono</td><td style="padding:8px 0;font-weight:600">${phone.trim()}</td></tr>` : ""}
        </table>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0;white-space:pre-wrap">${message.trim()}</p>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">${site.name}</p>
      </body></html>`,
    }).catch(console.error);
  }

  // Create in-app notification
  await prisma.siteNotification.create({
    data: {
      siteId: site.id,
      title: "Nuevo mensaje de contacto",
      body: `${name.trim()}: ${message.trim().slice(0, 80)}`,
      type: "info",
      link: `/site/${slug}/admin`,
    },
  });

  return NextResponse.json({ ok: true });
}
