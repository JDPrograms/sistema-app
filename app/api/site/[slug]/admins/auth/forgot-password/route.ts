import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendEmail, passwordResetHtml } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ip = getClientIp(req);
  if (!rateLimit(`forgot-siteadmin:${ip}`, 3, 60_000)) {
    return NextResponse.json({ ok: true });
  }

  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, name: true, emailApiKey: true, emailFrom: true },
  });
  if (!site) return NextResponse.json({ ok: true });

  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ ok: true });

  const normalizedEmail = email.trim().toLowerCase();
  const admin = await prisma.siteAdmin.findUnique({
    where: { email_siteId: { email: normalizedEmail, siteId: site.id } },
    select: { id: true, name: true, email: true },
  });

  if (admin) {
    await prisma.passwordResetToken.deleteMany({
      where: { email: admin.email, role: "siteadmin", siteId: site.id, usedAt: null },
    });

    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        token,
        email: admin.email,
        role: "siteadmin",
        siteId: site.id,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const resetUrl = `${appUrl}/site/${slug}/auth/reset-password?token=${token}`;

    sendEmail({
      apiKey: site.emailApiKey,
      from: site.emailFrom,
      to: admin.email,
      subject: `Restablecer contraseña — ${site.name}`,
      html: passwordResetHtml({ name: admin.name, resetUrl }),
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
