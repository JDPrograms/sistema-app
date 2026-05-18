import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Public: GET session+messages by ID. Admin: PATCH to update status/assign.
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
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug, sessionId } = await params;

  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { status, assignedAdminId, assignedAdminName } = body;

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (assignedAdminId !== undefined) data.assignedAdminId = assignedAdminId;
  if (assignedAdminName !== undefined) data.assignedAdminName = assignedAdminName;

  // When admin takes over, add a system message
  const updated = await prisma.siteChatSession.update({
    where: { id: sessionId },
    data,
  });

  if (status === "human" && assignedAdminName) {
    await prisma.siteChatMessage.create({
      data: {
        sessionId,
        role: "system",
        content: `${assignedAdminName} se unio a la conversacion.`,
      },
    });
  }
  if (status === "resolved") {
    await prisma.siteChatMessage.create({
      data: { sessionId, role: "system", content: "Conversacion finalizada." },
    });
  }

  return NextResponse.json(updated);
}
