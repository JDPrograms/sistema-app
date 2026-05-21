import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function checkAdmin(slug: string, session: any) {
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return null;
  const role = session?.user?.role;
  if (role === "superadmin") return site;
  if (role === "siteadmin" && session.user.siteSlug === slug) return site;
  return null;
}

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "users";

  let rows: Record<string, any>[] = [];

  if (type === "users") {
    const users = await prisma.siteUser.findMany({ where: { siteId: site.id }, select: { name: true, email: true, phone: true, createdAt: true } });
    rows = users.map((u) => ({ Nombre: u.name, Email: u.email, Telefono: u.phone || "", Registro: u.createdAt.toISOString() }));
  } else if (type === "appointments") {
    const apps = await prisma.siteAppointment.findMany({ where: { siteId: site.id }, orderBy: { createdAt: "desc" } });
    rows = apps.map((a) => ({ Cliente: a.clientName, Email: a.clientEmail, Telefono: a.clientPhone || "", Servicio: a.serviceName || "", Personal: a.staffName || "", Fecha: a.date, Hora: a.time, Estado: a.status, Creado: a.createdAt.toISOString() }));
  } else if (type === "invoices") {
    const invs = await prisma.siteInvoice.findMany({ where: { siteId: site.id }, orderBy: { createdAt: "desc" } });
    rows = invs.map((i) => ({ Numero: i.number, Tipo: i.type, Cliente: i.clientName, Email: i.clientEmail || "", Total: i.total, Estado: i.status, Fecha: i.createdAt.toISOString() }));
  } else if (type === "newsletter") {
    const subs = await prisma.siteNewsletterSubscriber.findMany({ where: { siteId: site.id } });
    rows = subs.map((s) => ({ Email: s.email, Nombre: s.name || "", Activo: s.isActive ? "si" : "no", Registro: s.createdAt.toISOString() }));
  } else if (type === "reviews") {
    const revs = await prisma.siteReview.findMany({ where: { siteId: site.id } });
    rows = revs.map((r) => ({ Cliente: r.clientName, Email: r.clientEmail || "", Calificacion: r.rating, Comentario: r.comment || "", Aprobada: r.isApproved ? "si" : "no", Fecha: r.createdAt.toISOString() }));
  }

  const csv = toCSV(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${slug}-${Date.now()}.csv"`,
    },
  });
}
