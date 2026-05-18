import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin: GET lists all sessions, optionally filtered by status or queueId
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const queueFilter = url.searchParams.get("queueId");

  const sessions = await prisma.siteChatSession.findMany({
    where: {
      siteId: site.id,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(queueFilter ? { queueId: queueFilter } : {}),
    },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(sessions);
}

// Public: POST creates a new chat session
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { clientName, clientEmail, queueId, queueName } = body;

  const chatSession = await prisma.siteChatSession.create({
    data: {
      siteId: site.id,
      clientName: clientName || null,
      clientEmail: clientEmail || null,
      queueId: queueId || null,
      queueName: queueName || null,
    },
  });
  return NextResponse.json(chatSession, { status: 201 });
}
