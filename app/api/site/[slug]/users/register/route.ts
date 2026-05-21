import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendEmail, verifyEmailHtml } from "@/lib/email";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, name: true, emailApiKey: true, emailFrom: true },
  });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });

  const { name, email, password, phone } = await req.json();
  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Nombre, email y contraseña son requeridos" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }
  if (!/[A-Z]/.test(password)) {
    return NextResponse.json({ error: "La contraseña debe contener al menos una letra mayúscula" }, { status: 400 });
  }
  if (!/[0-9]/.test(password)) {
    return NextResponse.json({ error: "La contraseña debe contener al menos un número" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.siteUser.findUnique({
    where: { email_siteId: { email: normalizedEmail, siteId: site.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const verifyToken = randomBytes(32).toString("hex");
  const user = await prisma.siteUser.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      phone: phone?.trim() || null,
      siteId: site.id,
      emailVerified: false,
      verifyToken,
      provider: "email",
    },
    select: { id: true, name: true, email: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${verifyToken}&slug=${slug}`;

  sendEmail({
    apiKey: site.emailApiKey,
    from: site.emailFrom,
    to: normalizedEmail,
    subject: `Verifica tu cuenta — ${site.name}`,
    html: verifyEmailHtml({ clientName: name.trim(), businessName: site.name, verifyUrl }),
  }).catch(console.error);

  return NextResponse.json({ ...user, needsVerification: true }, { status: 201 });
}
