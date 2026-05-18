import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function canManageAdmins(session: any) {
  return session?.user?.isMaster || session?.user?.permissions?.canManageAdmins;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!canManageAdmins(session)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
  const { id } = await params;
  const target = await prisma.superAdmin.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (target.isMaster) return NextResponse.json({ error: "No se puede modificar al master" }, { status: 403 });

  const body = await req.json();
  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.password && body.password.length >= 6) data.password = await bcrypt.hash(body.password, 10);
  if (body.permissions !== undefined) {
    data.permissions = typeof body.permissions === "string" ? body.permissions : JSON.stringify(body.permissions ?? {});
  }

  const updated = await prisma.superAdmin.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, isMaster: true, permissions: true, createdAt: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!canManageAdmins(session)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
  const { id } = await params;
  if (id === (session.user as any).id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }
  const target = await prisma.superAdmin.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (target.isMaster) return NextResponse.json({ error: "No se puede eliminar al master" }, { status: 403 });

  await prisma.superAdmin.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
