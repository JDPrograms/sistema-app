import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (role === "siteadmin" && (session.user as any).siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });

  const { plan, message } = await req.json() as { plan: string; message?: string };
  if (!["pro", "enterprise"].includes(plan)) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  // Only allow one pending request per site
  const existing = await prisma.planRequest.findFirst({
    where: { siteId: site.id, status: "pending" },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya tienes una solicitud pendiente. El equipo se pondrá en contacto contigo." }, { status: 409 });
  }

  const request = await prisma.planRequest.create({
    data: { siteId: site.id, plan, message: message?.trim() || null },
  });

  // Notify superadmin via platform notification (best-effort)
  try {
    const { sendEmail } = await import("@/lib/email");
    const adminEmail = process.env.DIRECTOR_EMAIL || process.env.SYSTEM_EMAIL_FROM;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `[Plan] Solicitud de ${site.name} — Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
        html: `<div style="font-family:sans-serif;max-width:500px;padding:24px">
          <h2>Nueva solicitud de plan</h2>
          <p><strong>Negocio:</strong> ${site.name} (/${slug})</p>
          <p><strong>Plan solicitado:</strong> ${plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
          ${message ? `<p><strong>Mensaje:</strong> ${message}</p>` : ""}
          <p><a href="${process.env.NEXTAUTH_URL}/admin/plan-requests" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Ver solicitudes</a></p>
        </div>`,
      });
    }
  } catch { /* email is best-effort */ }

  return NextResponse.json(request, { status: 201 });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (role === "siteadmin" && (session.user as any).siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const requests = await prisma.planRequest.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json(requests);
}
