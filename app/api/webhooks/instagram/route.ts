import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chat, buildPublicContext } from "@/lib/ai";
import { sendInstagramMessage } from "@/lib/instagram";
import { sendPushToSite } from "@/lib/push";

// ── GET: Meta webhook verification ────────────────────────────────
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const challenge = url.searchParams.get("hub.challenge");
  const token = url.searchParams.get("hub.verify_token");

  if (mode !== "subscribe" || !token || !challenge) {
    return new Response("Bad request", { status: 400 });
  }

  const site = await prisma.site.findFirst({ where: { instagramVerifyToken: token } });
  if (site) return new Response(challenge, { status: 200 });

  return new Response("Forbidden", { status: 403 });
}

// ── POST: Incoming messages ────────────────────────────────────────
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  handleIncoming(body).catch(console.error);

  return NextResponse.json({ ok: true });
}

async function handleIncoming(body: any) {
  if (body.object !== "instagram") return;

  for (const entry of body.entry ?? []) {
    const igUserId: string = entry.id;

    // Find site by Instagram user ID
    const site = await prisma.site.findFirst({
      where: { instagramUserId: igUserId },
      select: { id: true, slug: true, chatAgentId: true, instagramToken: true },
    });
    if (!site?.instagramToken) continue;

    for (const messaging of entry.messaging ?? []) {
      const senderId: string = messaging.sender?.id;
      const text: string = messaging.message?.text;

      if (!senderId || !text || senderId === igUserId) continue;

      // Find or create session
      let session = await prisma.siteChatSession.findFirst({
        where: { siteId: site.id, whatsappFrom: senderId, channel: "instagram", status: { not: "resolved" } },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      const isNew = !session;
      if (!session) {
        session = await prisma.siteChatSession.create({
          data: {
            siteId: site.id,
            channel: "instagram",
            whatsappFrom: senderId,
            status: "bot",
          },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        });
      }
      if (isNew) {
        sendPushToSite(site.id, {
          title: "Nuevo mensaje de Instagram",
          body: text.slice(0, 80),
          url: `/site/${site.slug}/admin/support`,
        }).catch(console.error);
      }

      if (session.status === "resolved") continue;

      await prisma.siteChatMessage.create({
        data: { sessionId: session.id, role: "user", content: text },
      });
      await prisma.siteChatSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } });

      if (session.status === "human") continue;

      // Detect human request
      const humanKeywords = /\b(agente|humano|persona|asesor|operador|hablar con alguien|quiero ayuda humana)\b/i;
      if (session.status === "bot" && humanKeywords.test(text)) {
        await prisma.siteChatSession.update({ where: { id: session.id }, data: { status: "waiting" } });
        await prisma.siteChatMessage.create({
          data: { sessionId: session.id, role: "system", content: "Solicitud de agente humano recibida." },
        });
        await sendInstagramMessage(senderId, site.instagramToken,
          "Entendido. Tu solicitud fue enviada a nuestro equipo. En breve un agente se comunicará contigo.");
        continue;
      }

      if (session.status === "waiting") continue;

      // Bot mode: AI response
      try {
        const history = (session.messages ?? []).map((m) => ({
          role: (m.role === "bot" ? "assistant" : "user") as "user" | "assistant",
          content: m.content,
        }));
        history.push({ role: "user", content: text });

        let systemPrompt = "Eres un asistente de soporte al cliente útil y amable respondiendo por Instagram. Responde en español, texto plano sin markdown. Respuestas cortas y directas (máximo 3 oraciones). Si el cliente necesita hablar con una persona, dile que escriba la palabra AGENTE.";
        systemPrompt = await buildPublicContext(site.slug, systemPrompt);

        const result = await chat(history, systemPrompt, null);

        await prisma.siteChatMessage.create({
          data: { sessionId: session.id, role: "bot", content: result.text },
        });
        await prisma.siteChatSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } });

        await sendInstagramMessage(senderId, site.instagramToken, result.text);
      } catch (e) {
        console.error("IG bot error:", e);
        await sendInstagramMessage(senderId, site.instagramToken,
          "Lo siento, ocurrió un error. Por favor intenta de nuevo.");
      }
    }
  }
}
