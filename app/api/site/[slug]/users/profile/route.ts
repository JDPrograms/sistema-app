import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "siteuser" || user?.siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const profile = await prisma.siteUser.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, phone: true },
  });
  return NextResponse.json(profile);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "siteuser" || user?.siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { name, phone } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const updated = await prisma.siteUser.update({
    where: { id: user.id },
    data: { name: name.trim(), phone: phone?.trim() || null },
    select: { name: true, email: true, phone: true },
  });
  return NextResponse.json(updated);
}
