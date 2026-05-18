import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const sites = await prisma.site.findMany({
    include: { _count: { select: { users: true, admins: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sites);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const { name, slug, template, adminEmail, adminName, adminPassword, primaryColor } = body;

  if (!name || !slug || !template || !adminEmail || !adminName || !adminPassword) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const existing = await prisma.site.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "El slug ya está en uso" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const site = await prisma.site.create({
    data: {
      name,
      slug,
      template,
      modules: JSON.stringify({
        appointments: false,
        content: false,
        products: false,
        billing: false,
        ads: false,
        users: false,
        customize: false,
        ai: false,
        support: false,
      }),
      ...(primaryColor && { primaryColor }),
      admins: {
        create: { email: adminEmail, name: adminName, password: hashedPassword },
      },
    },
  });

  return NextResponse.json(site, { status: 201 });
}
