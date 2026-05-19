import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDomainToVercel, removeDomainFromVercel, getDomainStatus } from "@/lib/vercel-domains";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const site = await prisma.site.findUnique({ where: { id }, select: { customDomain: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!site.customDomain) return NextResponse.json({ customDomain: null, status: null });

  const status = await getDomainStatus(site.customDomain);
  return NextResponse.json({ customDomain: site.customDomain, status });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const { domain } = await req.json();
  if (!domain?.trim()) return NextResponse.json({ error: "Dominio requerido" }, { status: 400 });

  const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");

  const conflict = await prisma.site.findFirst({ where: { customDomain: clean } });
  if (conflict && conflict.id !== id) {
    return NextResponse.json({ error: "Ese dominio ya está asignado a otro sitio" }, { status: 409 });
  }

  const site = await prisma.site.findUnique({ where: { id }, select: { customDomain: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (site.customDomain && site.customDomain !== clean) {
    await removeDomainFromVercel(site.customDomain).catch(() => {});
  }

  let vercelOk = true;
  let vercelMsg = "";
  try {
    await addDomainToVercel(clean);
  } catch (e: any) {
    vercelOk = false;
    vercelMsg = e.message;
  }

  await prisma.site.update({ where: { id }, data: { customDomain: clean } });

  return NextResponse.json({ ok: true, domain: clean, vercelOk, vercelMsg });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const site = await prisma.site.findUnique({ where: { id }, select: { customDomain: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (site.customDomain) {
    await removeDomainFromVercel(site.customDomain).catch(() => {});
    await prisma.site.update({ where: { id }, data: { customDomain: null } });
  }
  return NextResponse.json({ ok: true });
}
