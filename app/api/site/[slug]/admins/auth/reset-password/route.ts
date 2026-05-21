import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Datos requeridos" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }
  if (!/[A-Z]/.test(password)) {
    return NextResponse.json({ error: "Debe contener al menos una mayúscula" }, { status: 400 });
  }
  if (!/[0-9]/.test(password)) {
    return NextResponse.json({ error: "Debe contener al menos un número" }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (
    !record ||
    record.role !== "siteadmin" ||
    record.siteId !== site.id ||
    record.usedAt ||
    record.expiresAt < new Date()
  ) {
    return NextResponse.json({ error: "El enlace es inválido o ha expirado" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.siteAdmin.update({
      where: { email_siteId: { email: record.email, siteId: site.id } },
      data: { password: hashed },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
