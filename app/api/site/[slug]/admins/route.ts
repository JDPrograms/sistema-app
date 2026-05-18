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

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!session || !canManageAdmins(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const admins = await prisma.siteAdmin.findMany({
    where: { siteId: site.id },
    select: { id: true, email: true, name: true, isOwner: true, permissions: true, createdAt: true },
    orderBy: [{ isOwner: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(admins);
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!session || !canManageAdmins(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { name, email, password, permissions } = await req.json();
  if (!name || !email || !password || password.length < 6) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const existing = await prisma.siteAdmin.findUnique({ where: { email_siteId: { email, siteId: site.id } } });
  if (existing) return NextResponse.json({ error: "Email ya registrado en este sitio" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const admin = await prisma.siteAdmin.create({
    data: {
      name,
      email,
      password: hashed,
      siteId: site.id,
      isOwner: false,
      permissions: typeof permissions === "string" ? permissions : JSON.stringify(permissions ?? {}),
    },
    select: { id: true, email: true, name: true, isOwner: true, permissions: true, createdAt: true },
  });
  return NextResponse.json(admin, { status: 201 });
}
