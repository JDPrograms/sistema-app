import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Resend } from "resend";

const DIRECTOR_EMAIL = process.env.DIRECTOR_EMAIL || "jedimanbl@gmail.com";
const SYSTEM_FROM    = process.env.SYSTEM_EMAIL_FROM || "noreply@sistema.app";
const API_KEY        = process.env.RESEND_API_KEY;

export async function POST() {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 1. Check env vars are present
  const checks = {
    RESEND_API_KEY:    !!API_KEY,
    SYSTEM_EMAIL_FROM: SYSTEM_FROM,
    DIRECTOR_EMAIL:    DIRECTOR_EMAIL,
  };

  if (!API_KEY) {
    return NextResponse.json({
      ok: false,
      checks,
      error: "RESEND_API_KEY no está configurado en las variables de entorno.",
      fix: "Agrega RESEND_API_KEY en Vercel → Settings → Environment Variables.",
    });
  }

  // 2. Attempt to send a real test email
  try {
    const resend = new Resend(API_KEY);
    const result = await resend.emails.send({
      from: SYSTEM_FROM,
      to: DIRECTOR_EMAIL,
      subject: "✅ Test de email — Sistema de Sistemas",
      html: `<p>Este es un correo de prueba enviado desde <strong>Sistema de Sistemas</strong>.<br>
             Remitente: <code>${SYSTEM_FROM}</code><br>
             Destinatario: <code>${DIRECTOR_EMAIL}</code></p>`,
    });

    if (result.error) {
      return NextResponse.json({
        ok: false,
        checks,
        error: result.error.message,
        resendError: result.error,
        fix: getSuggestedFix(result.error.message),
      });
    }

    return NextResponse.json({ ok: true, checks, messageId: result.data?.id });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      checks,
      error: e.message ?? String(e),
      fix: getSuggestedFix(e.message ?? ""),
    });
  }
}

function getSuggestedFix(errorMsg: string): string {
  const msg = errorMsg.toLowerCase();
  if (msg.includes("domain") || msg.includes("not found") || msg.includes("not verified")) {
    return `El dominio del remitente "${SYSTEM_FROM}" no está verificado en Resend. Opciones:\n` +
      `1. Verifica el dominio en resend.com → Domains.\n` +
      `2. O cambia SYSTEM_EMAIL_FROM a "onboarding@resend.dev" para pruebas (solo envía al email de tu cuenta Resend).`;
  }
  if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("invalid")) {
    return "La RESEND_API_KEY parece inválida. Verifica que la copiaste correctamente desde resend.com → API Keys.";
  }
  if (msg.includes("testing") || msg.includes("can only send")) {
    return `Con el plan gratuito de Resend sin dominio verificado, solo puedes enviar a tu propio correo de la cuenta Resend.\n` +
      `Para enviar a ${DIRECTOR_EMAIL} necesitas verificar un dominio en resend.com → Domains.`;
  }
  return "Revisa los logs de Vercel para más detalles.";
}
