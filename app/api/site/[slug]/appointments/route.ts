import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, appointmentConfirmationHtml } from "@/lib/email";
import { sendPushToSite } from "@/lib/push";

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

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 25)));

  const [appointments, total] = await Promise.all([
    prisma.siteAppointment.findMany({
      where: {
        siteId: site.id,
        ...(status ? { status } : {}),
        ...(date ? { date } : {}),
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.siteAppointment.count({
      where: {
        siteId: site.id,
        ...(status ? { status } : {}),
        ...(date ? { date } : {}),
      },
    }),
  ]);
  return NextResponse.json({ data: appointments, total, page, limit });
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

  // Conflict detection: same staff + same date + same time slot
  if (body.staffId) {
    const conflict = await prisma.siteAppointment.findFirst({
      where: {
        siteId: site.id,
        staffId: body.staffId,
        date,
        time,
        status: { notIn: ["cancelled"] },
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "El profesional ya tiene una cita en ese horario" },
        { status: 409 }
      );
    }
  }

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

  // Send confirmation email (fire and forget)
  sendEmail({
    apiKey: (site as any).emailApiKey,
    from: (site as any).emailFrom,
    to: clientEmail,
    subject: `Cita confirmada — ${(site as any).name}`,
    html: appointmentConfirmationHtml({
      clientName,
      serviceName: service?.name,
      date,
      time,
      businessName: (site as any).name,
      businessPhone: (site as any).phone,
    }),
  }).catch(console.error);

  // Push notification to site admins
  sendPushToSite(site.id, {
    title: "Nueva cita",
    body: `${clientName} — ${date} ${time}`,
    url: `/site/${slug}/admin/appointments`,
  }).catch(console.error);

  return NextResponse.json(appointment, { status: 201 });
}
