import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — public, create a new chat session
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({
    where: { slug, isActive: true },
    select: { id: true },
  });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });

  const { clientName, clientEmail } = await req.json();

  const session = await prisma.siteChatSession.create({
    data: {
      siteId: site.id,
      clientName: clientName || null,
      clientEmail: clientEmail || null,
      status: "waiting",
      channel: "web",
    },
  });

  // Create welcome message
  await prisma.siteChatMessage.create({
    data: {
      sessionId: session.id,
      role: "system",
      content: "Sesión de chat iniciada. Un agente te atenderá pronto.",
    },
  });

  return NextResponse.json({ sessionId: session.id }, { status: 201 });
}

// GET — admin: list all sessions for this site
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authSession = await auth();
  const role = (authSession?.user as any)?.role;
  if (!authSession || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { slug } = await params;
  if (role === "siteadmin" && (authSession.user as any).siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const sessions = await prisma.siteChatSession.findMany({
    where: {
      siteId: site.id,
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ sessions });
}
