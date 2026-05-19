import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, invoiceEmailHtml } from "@/lib/email";

function canManage(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string; invoiceId: string }> }) {
  const session = await auth();
  const { slug, invoiceId } = await params;
  if (!canManage(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, name: true, emailApiKey: true, emailFrom: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = await prisma.siteInvoice.findUnique({ where: { id: invoiceId } });
  const nowPaid = body.status === "paid" && current?.status !== "paid";
  const nowSent = body.status === "sent" && current?.status !== "sent";

  const invoice = await prisma.siteInvoice.update({
    where: { id: invoiceId },
    data: {
      clientName: body.clientName,
      clientEmail: body.clientEmail ?? null,
      clientPhone: body.clientPhone ?? null,
      clientAddress: body.clientAddress ?? null,
      status: body.status,
      items: body.items ?? "[]",
      subtotal: Number(body.subtotal ?? 0),
      taxRate: Number(body.taxRate ?? 0),
      discount: Number(body.discount ?? 0),
      total: Number(body.total ?? 0),
      notes: body.notes ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      paidAt: nowPaid ? new Date() : (body.paidAt ? new Date(body.paidAt) : null),
    },
  });

  if (nowSent && invoice.clientEmail) {
    sendEmail({
      apiKey: site.emailApiKey,
      from: site.emailFrom,
      to: invoice.clientEmail,
      subject: `${invoice.type === "quote" ? "Cotización" : "Factura"} ${invoice.number} — ${site.name}`,
      html: invoiceEmailHtml({
        clientName: invoice.clientName,
        invoiceNumber: invoice.number,
        total: invoice.total,
        dueDate: invoice.dueDate ? invoice.dueDate.toLocaleDateString("es-DO") : null,
        businessName: site.name,
      }),
    }).catch(console.error);
  }

  return NextResponse.json(invoice);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ slug: string; invoiceId: string }> }) {
  const session = await auth();
  const { slug, invoiceId } = await params;
  if (!canManage(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await prisma.siteInvoice.delete({ where: { id: invoiceId } });
  return NextResponse.json({ ok: true });
}
