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

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  const notes = await prisma.siteCustomerNote.findMany({
    where: { siteId: site.id, ...(email ? { clientEmail: email } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clientEmail, clientName, note, isPrivate } = await req.json();
  if (!clientEmail || !note) return NextResponse.json({ error: "Email y nota requeridos" }, { status: 400 });

  const created = await prisma.siteCustomerNote.create({
    data: {
      siteId: site.id, clientEmail, clientName: clientName || clientEmail,
      note, isPrivate: !!isPrivate,
      adminName: (session?.user as any)?.name || undefined,
    },
  });
  return NextResponse.json({ note: created });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await prisma.siteCustomerNote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
