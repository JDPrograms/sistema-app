import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const session = await auth();
  const user = session?.user as any;

  if (!session || user?.role !== "siteuser" || user?.siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const appointment = await prisma.siteAppointment.findUnique({ where: { id } });
  if (!appointment || appointment.siteId !== user.siteId) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }
  if (appointment.clientEmail !== session.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (appointment.status === "cancelled" || appointment.status === "completed") {
    return NextResponse.json({ error: "La cita no puede cancelarse en su estado actual" }, { status: 400 });
  }

  const updated = await prisma.siteAppointment.update({
    where: { id },
    data: { status: "cancelled" },
  });

  return NextResponse.json(updated);
}
