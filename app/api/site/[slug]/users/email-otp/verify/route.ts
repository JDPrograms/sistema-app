import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ip = getClientIp(req);
  if (!rateLimit(`email-otp-verify:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });
  }

  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });

  const { email, code } = await req.json();
  if (!email?.trim() || !code?.trim()) {
    return NextResponse.json({ error: "Email y código requeridos" }, { status: 400 });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const otp = await prisma.emailOtp.findFirst({
    where: {
      email: normalizedEmail,
      siteId: site.id,
      code: code.trim(),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!otp) {
    return NextResponse.json({ error: "Código inválido o expirado" }, { status: 400 });
  }

  // Mark OTP as used
  await prisma.emailOtp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

  // Find or create user linked to this email
  const googleLoginToken = randomBytes(32).toString("hex");
  const googleLoginExpires = new Date(Date.now() + 5 * 60 * 1000);

  let user = await prisma.siteUser.findUnique({
    where: { email_siteId: { email: normalizedEmail, siteId: site.id } },
  });

  if (user) {
    await prisma.siteUser.update({
      where: { id: user.id },
      data: { googleLoginToken, googleLoginExpires, emailVerified: true },
    });
  } else {
    user = await prisma.siteUser.create({
      data: {
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0],
        password: randomBytes(32).toString("hex"),
        siteId: site.id,
        emailVerified: true,
        provider: "email",
        googleLoginToken,
        googleLoginExpires,
      },
    });
  }

  // Return the short-lived token — client uses it with NextAuth google-siteuser provider
  return NextResponse.json({ token: googleLoginToken });
}
