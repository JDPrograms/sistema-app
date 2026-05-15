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
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await auth();
  const { slug, id } = await params;
  if (!canManage(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const appointment = await prisma.siteAppointment.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.date !== undefined && { date: body.date }),
      ...(body.time !== undefined && { time: body.time }),
      ...(body.staffId !== undefined && { staffId: body.staffId || null }),
      ...(body.staffName !== undefined && { staffName: body.staffName || null }),
    },
    include: { staff: true },
  });
  return NextResponse.json(appointment);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await auth();
  const { slug, id } = await params;
  if (!canManage(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await prisma.siteAppointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
