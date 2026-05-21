import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "siteuser" || user?.siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }
  if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return NextResponse.json({
      error: "La nueva contraseña debe tener 8+ caracteres, una mayúscula y un número",
    }, { status: 400 });
  }

  const dbUser = await prisma.siteUser.findUnique({
    where: { id: user.id },
    select: { password: true },
  });
  if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, dbUser.password);
  if (!valid) return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.siteUser.update({ where: { id: user.id }, data: { password: hashed } });

  return NextResponse.json({ ok: true });
}
