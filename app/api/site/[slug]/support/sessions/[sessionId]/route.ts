import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToSite } from "@/lib/push";

// Public: GET session + messages
export async function GET(req: Request, { params }: { params: Promise<{ slug: string; sessionId: string }> }) {
  const { slug, sessionId } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const chatSession = await prisma.siteChatSession.findFirst({
    where: { id: sessionId, siteId: site.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!chatSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(chatSession);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string; sessionId: string }> }) {
  const { slug, sessionId } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { status, assignedAdminId, assignedAdminName, queueId, queueName } = body;

  // Allow public (unauthenticated) requests only when transitioning to "waiting"
  const isPublicWaiting = status === "waiting" && !assignedAdminId && !assignedAdminName;

  if (!isPublicWaiting) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session || (role !== "superadmin" && role !== "siteadmin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (assignedAdminId !== undefined) data.assignedAdminId = assignedAdminId;
  if (assignedAdminName !== undefined) data.assignedAdminName = assignedAdminName;
  if (queueId !== undefined) data.queueId = queueId;
  if (queueName !== undefined) data.queueName = queueName;

  // Auto-assign an isAlwaysOn agent from the target queue when going to waiting
  if (status === "waiting" && queueId) {
    const queue = await prisma.supportQueue.findUnique({
      where: { id: queueId },
      include: {
        agents: { where: { isAlwaysOn: true, isAvailable: true }, take: 1, orderBy: { createdAt: "asc" } },
      },
    });
    if (queue?.agents[0]) {
      data.assignedAdminId = queue.agents[0].adminId;
      data.assignedAdminName = queue.agents[0].adminName;
      data.status = "human";
    }
  }

  const updated = await prisma.siteChatSession.update({
    where: { id: sessionId },
    data,
  });

  // System messages for state transitions
  if (data.status === "human" && data.assignedAdminName) {
    await prisma.siteChatMessage.create({
      data: {
        sessionId,
        role: "system",
        content: `${data.assignedAdminName} se unio a la conversacion.`,
      },
    });
  } else if (status === "waiting") {
    await prisma.siteChatMessage.create({
      data: {
        sessionId,
        role: "system",
        content: "Solicitud de agente enviada. Un agente se unirá pronto.",
      },
    });
    // Push notification to site admins when a user requests a human agent
    const chatSess = await prisma.siteChatSession.findUnique({ where: { id: sessionId }, select: { siteId: true, clientName: true } });
    if (chatSess) {
      sendPushToSite(chatSess.siteId, {
        title: "Cliente solicita agente",
        body: `${chatSess.clientName || "Visitante"} quiere hablar con un agente`,
        url: `/site/${slug}/admin/support`,
      }).catch(console.error);
    }
  }
  if (status === "resolved") {
    await prisma.siteChatMessage.create({
      data: { sessionId, role: "system", content: "Conversacion finalizada." },
    });
  }

  return NextResponse.json(updated);
}
