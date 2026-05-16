import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; adminId: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { adminId } = await params;
  const { password } = await req.json();

  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.siteAdmin.update({ where: { id: adminId }, data: { password: hashed } });
  return NextResponse.json({ ok: true });
}
