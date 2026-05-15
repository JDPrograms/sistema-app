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
  { params }: { params: Promise<{ slug: string; staffId: string }> }
) {
  const session = await auth();
  const { slug, staffId } = await params;
  if (!canManage(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const staff = await prisma.siteStaff.update({
    where: { id: staffId },
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      specialty: body.specialty,
      isActive: body.isActive,
    },
  });
  return NextResponse.json(staff);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ slug: string; staffId: string }> }
) {
  const session = await auth();
  const { slug, staffId } = await params;
  if (!canManage(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await prisma.siteStaff.delete({ where: { id: staffId } });
  return NextResponse.json({ ok: true });
}
