import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const current = await prisma.siteInvoice.findUnique({ where: { id: invoiceId } });
  const nowPaid = body.status === "paid" && current?.status !== "paid";

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
  return NextResponse.json(invoice);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ slug: string; invoiceId: string }> }) {
  const session = await auth();
  const { slug, invoiceId } = await params;
  if (!canManage(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await prisma.siteInvoice.delete({ where: { id: invoiceId } });
  return NextResponse.json({ ok: true });
}
