import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chat, buildPublicContext } from "@/lib/ai";
import { sendWhatsAppText } from "@/lib/whatsapp";

async function trySendWhatsApp(siteId: string, sessionId: string, text: string) {
  try {
    const [site, session] = await Promise.all([
      prisma.site.findUnique({ where: { id: siteId }, select: { whatsappPhoneNumberId: true, whatsappToken: true } }),
      prisma.siteChatSession.findUnique({ where: { id: sessionId }, select: { channel: true, whatsappFrom: true } }),
    ]);
    if (session?.channel === "whatsapp" && session.whatsappFrom && site?.whatsappPhoneNumberId && site.whatsappToken) {
      await sendWhatsAppText(site.whatsappPhoneNumberId, site.whatsappToken, session.whatsappFrom, text);
    }
  } catch (e) {
    console.error("WA send error:", e);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string; sessionId: string }> }) {
  const { slug, sessionId } = await params;

  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, chatAgentId: true, modules: true },
  });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const chatSession = await prisma.siteChatSession.findFirst({
    where: { id: sessionId, siteId: site.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!chatSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { content, role, adminId, adminName } = body;

  if (!content?.trim()) return NextResponse.json({ error: "Mensaje vacio" }, { status: 400 });

  await prisma.siteChatMessage.create({
    data: {
      sessionId,
      role: role || "user",
      content: content.trim(),
      adminId: adminId || null,
      adminName: adminName || null,
    },
  });

  await prisma.siteChatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });

  // If human agent is replying, forward to WhatsApp if applicable
  if (role === "human") {
    await trySendWhatsApp(site.id, sessionId, content.trim());
    return NextResponse.json({ botReply: null });
  }

  if (chatSession.status === "waiting" || chatSession.status === "human") {
    return NextResponse.json({ botReply: null });
  }

  // Bot mode: AI response
  if (chatSession.status === "bot" && role === "user") {
    try {
      const history = chatSession.messages.map((m) => ({
        role: (m.role === "bot" ? "assistant" : "user") as "user" | "assistant",
        content: m.content,
      }));
      history.push({ role: "user", content: content.trim() });

      let systemPrompt = "Eres un asistente de soporte al cliente util y amable. Responde en español, texto plano sin markdown. Respuestas cortas y directas. Si el cliente necesita hablar con una persona real, indícale que puede hacer clic en el botón 'Hablar con un agente'.";
      systemPrompt = await buildPublicContext(slug, systemPrompt);

      const result = await chat(history, systemPrompt, null);

      const botMsg = await prisma.siteChatMessage.create({
        data: { sessionId, role: "bot", content: result.text },
      });
      await prisma.siteChatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });

      // Forward bot reply to WhatsApp if session is from that channel
      await trySendWhatsApp(site.id, sessionId, result.text);

      return NextResponse.json({ botReply: botMsg });
    } catch {
      return NextResponse.json({ botReply: null });
    }
  }

  return NextResponse.json({ botReply: null });
}
