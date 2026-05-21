import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
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

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.role !== "superadmin" || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "El enlace es inválido o ha expirado" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.superAdmin.update({
      where: { email: record.email },
      data: { password: hashed },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
