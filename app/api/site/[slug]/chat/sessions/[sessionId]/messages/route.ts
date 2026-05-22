import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToSite } from "@/lib/push";

// GET — fetch messages for a session (public with sessionId)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; sessionId: string }> }
) {
  const { slug, sessionId } = await params;

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const session = await prisma.siteChatSession.findFirst({
    where: { id: sessionId, siteId: site.id },
  });
  if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

  const messages = await prisma.siteChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, adminName: true, createdAt: true },
  });

  return NextResponse.json({ messages, status: session.status });
}

// POST — send a message (public = client, auth = admin reply)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; sessionId: string }> }
) {
  const { slug, sessionId } = await params;

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const session = await prisma.siteChatSession.findFirst({
    where: { id: sessionId, siteId: site.id },
  });
  if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  if (session.status === "resolved") {
    return NextResponse.json({ error: "Esta sesión está cerrada" }, { status: 400 });
  }

  const authSession = await auth();
  const role = (authSession?.user as any)?.role;
  const isAdmin = authSession && (role === "superadmin" || role === "siteadmin");

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });

  if (isAdmin) {
    // Admin sending reply
    const adminName = authSession!.user?.name ?? "Admin";
    const message = await prisma.siteChatMessage.create({
      data: { sessionId, role: "human", content: content.trim(), adminName },
    });
    // Mark session as human-handled
    if (session.status === "waiting") {
      await prisma.siteChatSession.update({
        where: { id: sessionId },
        data: { status: "human", assignedAdminName: adminName },
      });
    }
    return NextResponse.json(message, { status: 201 });
  } else {
    // Client sending message
    const message = await prisma.siteChatMessage.create({
      data: { sessionId, role: "user", content: content.trim() },
    });
    // Update session timestamp
    await prisma.siteChatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
    // Push notification to site admins
    sendPushToSite(site.id, {
      title: `Mensaje nuevo — ${session.clientName ?? "Cliente"}`,
      body: content.trim().slice(0, 80),
      url: `/site/${slug}/admin/chat`,
    }).catch(() => {});
    return NextResponse.json(message, { status: 201 });
  }
}
