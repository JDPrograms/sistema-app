import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; serviceId: string }> }
) {
  const session = await auth();
  const { slug, serviceId } = await params;
  if (!canManage(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const service = await prisma.siteService.update({
    where: { id: serviceId },
    data: {
      name: body.name,
      description: body.description ?? null,
      price: body.price != null ? Number(body.price) : null,
      duration: body.duration != null ? Number(body.duration) : null,
      imageUrl: body.imageUrl ?? null,
      isActive: body.isActive,
    },
  });
  return NextResponse.json(service);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ slug: string; serviceId: string }> }
) {
  const session = await auth();
  const { slug, serviceId } = await params;
  if (!canManage(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await prisma.siteService.delete({ where: { id: serviceId } });
  return NextResponse.json({ ok: true });
}
