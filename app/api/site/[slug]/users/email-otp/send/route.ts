import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailOtpHtml } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ip = getClientIp(req);
  if (!rateLimit(`email-otp:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
  }

  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, name: true, emailApiKey: true, emailFrom: true },
  });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });

  const { email } = await req.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }
  const normalizedEmail = email.trim().toLowerCase();

  // Invalidate previous OTPs for this email+site
  await prisma.emailOtp.deleteMany({
    where: { email: normalizedEmail, siteId: site.id, usedAt: null },
  });

  const code = generateOtp();
  await prisma.emailOtp.create({
    data: {
      email: normalizedEmail,
      code,
      siteId: site.id,
      purpose: "login",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await sendEmail({
    apiKey: site.emailApiKey,
    from: site.emailFrom,
    to: normalizedEmail,
    subject: `Tu código de verificación — ${site.name}`,
    html: emailOtpHtml({ code }),
  });

  return NextResponse.json({ ok: true });
}
