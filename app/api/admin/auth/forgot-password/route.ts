import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendEmail, passwordResetHtml } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`forgot-superadmin:${ip}`, 3, 60_000)) {
    return NextResponse.json({ ok: true }); // respuesta genérica para no revelar info
  }

  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ ok: true });

  const admin = await prisma.superAdmin.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true },
  });

  if (admin) {
    // Invalidate previous tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: admin.email, role: "superadmin", usedAt: null },
    });

    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        token,
        email: admin.email,
        role: "superadmin",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const resetUrl = `${appUrl}/admin/auth/reset-password?token=${token}`;

    sendEmail({
      to: admin.email,
      subject: "Restablecer contraseña — Sistema de Sistemas",
      html: passwordResetHtml({ name: admin.name, resetUrl }),
    }).catch(console.error);
  }

  // Always return ok to avoid email enumeration
  return NextResponse.json({ ok: true });
}
