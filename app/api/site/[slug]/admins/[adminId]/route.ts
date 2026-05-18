import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function canManageAdmins(session: any, slug: string) {
  const role = (session?.user as any)?.role;
  if (role === "superadmin") return true;
  if (role === "siteadmin" && (session.user as any).siteSlug === slug) {
    return (session.user as any).isOwner || (session.user as any).permissions?.canManageAdmins;
  }
  return false;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; adminId: string }> }
) {
  const session = await auth();
  const { slug, adminId } = await params;
  if (!session || !canManageAdmins(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const target = await prisma.siteAdmin.findUnique({ where: { id: adminId } });
  if (!target) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (target.isOwner && (session.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No se puede modificar al propietario" }, { status: 403 });
  }

  const body = await req.json();
  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.password && body.password.length >= 6) data.password = await bcrypt.hash(body.password, 10);
  if (body.permissions !== undefined) {
    data.permissions = typeof body.permissions === "string" ? body.permissions : JSON.stringify(body.permissions ?? {});
  }

  const updated = await prisma.siteAdmin.update({
    where: { id: adminId },
    data,
    select: { id: true, email: true, name: true, isOwner: true, permissions: true, createdAt: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ slug: string; adminId: string }> }
) {
  const session = await auth();
  const { slug, adminId } = await params;
  if (!session || !canManageAdmins(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (adminId === (session.user as any).id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }
  const target = await prisma.siteAdmin.findUnique({ where: { id: adminId } });
  if (!target) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (target.isOwner && (session.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No se puede eliminar al propietario" }, { status: 403 });
  }

  await prisma.siteAdmin.delete({ where: { id: adminId } });
  return NextResponse.json({ ok: true });
}
