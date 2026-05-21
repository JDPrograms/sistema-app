import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }
  if (!/[A-Z]/.test(newPassword)) {
    return NextResponse.json({ error: "Debe contener al menos una mayúscula" }, { status: 400 });
  }
  if (!/[0-9]/.test(newPassword)) {
    return NextResponse.json({ error: "Debe contener al menos un número" }, { status: 400 });
  }

  const email = session.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  const admin = await prisma.superAdmin.findUnique({ where: { email } });
  if (!admin) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const match = await bcrypt.compare(currentPassword, admin.password);
  if (!match) {
    return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.superAdmin.update({
    where: { email },
    data: { password: hashed },
  });

  return NextResponse.json({ ok: true });
}
