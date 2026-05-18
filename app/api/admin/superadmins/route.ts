import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function canManageAdmins(session: any) {
  return session?.user?.isMaster || session?.user?.permissions?.canManageAdmins;
}

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!canManageAdmins(session)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
  const admins = await prisma.superAdmin.findMany({
    select: { id: true, email: true, name: true, isMaster: true, permissions: true, createdAt: true },
    orderBy: [{ isMaster: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(admins);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!canManageAdmins(session)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
  const { name, email, password, permissions } = await req.json();
  if (!name || !email || !password || password.length < 6) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const existing = await prisma.superAdmin.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email ya registrado" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const admin = await prisma.superAdmin.create({
    data: {
      name,
      email,
      password: hashed,
      isMaster: false,
      permissions: typeof permissions === "string" ? permissions : JSON.stringify(permissions ?? {}),
    },
    select: { id: true, email: true, name: true, isMaster: true, permissions: true, createdAt: true },
  });
  return NextResponse.json(admin, { status: 201 });
}
