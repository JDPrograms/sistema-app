import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!canManage(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const appointments = await prisma.siteAppointment.findMany({
    where: {
      siteId: site.id,
      ...(status ? { status } : {}),
      ...(date ? { date } : {}),
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  return NextResponse.json(appointments);
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({
    where: { slug, isActive: true },
    include: { services: { where: { isActive: true } } },
  });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });

  const body = await req.json();
  const { clientName, clientEmail, clientPhone, serviceId, date, time, notes } = body;

  if (!clientName || !clientEmail || !date || !time) {
    return NextResponse.json({ error: "Nombre, email, fecha y hora son requeridos" }, { status: 400 });
  }

  const service = serviceId ? site.services.find((s) => s.id === serviceId) : null;

  const appointment = await prisma.siteAppointment.create({
    data: {
      siteId: site.id,
      clientName,
      clientEmail,
      clientPhone: clientPhone || null,
      serviceId: serviceId || null,
      serviceName: service?.name || null,
      date,
      time,
      notes: notes || null,
      status: "pending",
    },
  });
  return NextResponse.json(appointment, { status: 201 });
}
