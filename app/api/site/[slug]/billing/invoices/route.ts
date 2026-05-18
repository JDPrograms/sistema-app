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
  if (!canManage(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const invoices = await prisma.siteInvoice.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!canManage(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const type = body.type || "invoice";
  const cfg = (() => { try { return JSON.parse((site as any).billingConfig || "{}"); } catch { return {}; } })();
  const prefix = type === "invoice" ? (cfg.invoicePrefix || "FAC") : (cfg.quotePrefix || "COT");
  const count = await prisma.siteInvoice.count({ where: { siteId: site.id, type } });
  const number = `${prefix}-${String(count + 1).padStart(4, "0")}`;

  const invoice = await prisma.siteInvoice.create({
    data: {
      siteId: site.id,
      type,
      number,
      clientName: body.clientName,
      clientEmail: body.clientEmail ?? null,
      clientPhone: body.clientPhone ?? null,
      clientAddress: body.clientAddress ?? null,
      status: body.status ?? "draft",
      items: body.items ?? "[]",
      subtotal: Number(body.subtotal ?? 0),
      taxRate: Number(body.taxRate ?? 0),
      discount: Number(body.discount ?? 0),
      total: Number(body.total ?? 0),
      notes: body.notes ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  });
  return NextResponse.json(invoice, { status: 201 });
}
