import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyDirector } from "@/lib/director-notify";

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

  if (body.status === "cancelled") {
    // Check cancellation spike: >40% of last-30-days appointments cancelled
    const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, name: true } });
    if (site) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const [total, cancelled] = await Promise.all([
        prisma.siteAppointment.count({ where: { siteId: site.id, date: { gte: thirtyDaysAgo } } }),
        prisma.siteAppointment.count({ where: { siteId: site.id, status: "cancelled", date: { gte: thirtyDaysAgo } } }),
      ]);
      if (total >= 10 && cancelled / total >= 0.5) {
        notifyDirector({
          event: "appointment_cancelled_spike",
          title: `Spike de cancelaciones: ${site.name}`,
          body: `El sitio "${site.name}" tiene ${cancelled} cancelaciones de ${total} citas en los últimos 30 días (${Math.round(cancelled / total * 100)}%).`,
          dedupKey: site.id,
          cooldownMinutes: 1440, // máximo una vez al día por sitio
        }).catch(() => {});
      }
    }
  }

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
