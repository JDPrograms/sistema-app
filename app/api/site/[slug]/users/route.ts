import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function checkAuth(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!(await checkAuth(session, slug))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });
  const users = await prisma.siteUser.findMany({
    where: { siteId: site.id },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!(await checkAuth(session, slug))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });

  const body = await req.json();
  const { email, name, password, phone } = body;
  if (!email || !name || !password) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const existing = await prisma.siteUser.findUnique({
    where: { email_siteId: { email, siteId: site.id } },
  });
  if (existing) return NextResponse.json({ error: "El email ya existe" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.siteUser.create({
    data: { email, name, password: hashed, phone, siteId: site.id },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
  });
  return NextResponse.json(user, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!(await checkAuth(session, slug))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { userId } = await req.json();
  await prisma.siteUser.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
