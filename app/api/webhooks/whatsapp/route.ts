import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chat, buildPublicContext } from "@/lib/ai";
import { sendWhatsAppText, markAsRead } from "@/lib/whatsapp";
import { sendPushToSite } from "@/lib/push";
import { createHmac, timingSafeEqual } from "crypto";

// ── GET: Meta webhook verification ────────────────────────────────
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const challenge = url.searchParams.get("hub.challenge");
  const token = url.searchParams.get("hub.verify_token");

  if (mode !== "subscribe" || !token || !challenge) {
    return new Response("Bad request", { status: 400 });
  }

  // Check token against any configured site OR global env var
  const globalToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (globalToken && token === globalToken) {
    return new Response(challenge, { status: 200 });
  }

  const site = await prisma.site.findFirst({ where: { whatsappVerifyToken: token } });
  if (site) return new Response(challenge, { status: 200 });

  return new Response("Forbidden", { status: 403 });
}

// ── POST: Incoming messages ────────────────────────────────────────
export async function POST(req: Request) {
  const rawBody = await req.text();

  // Verify HMAC-SHA256 signature from Meta
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const signature = req.headers.get("x-hub-signature-256");
    if (!signature) {
      return new Response("Missing signature", { status: 403 });
    }
    const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    const signaturesMatch =
      sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
    if (!signaturesMatch) {
      return new Response("Invalid signature", { status: 403 });
    }
  }

  // Always respond 200 quickly so Meta doesn't retry
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (!body) return NextResponse.json({ ok: true });

  // Process asynchronously (don't await — just fire)
  handleIncoming(body).catch(console.error);

  return NextResponse.json({ ok: true });
}

async function handleIncoming(body: any) {
  const entries: any[] = body.entry ?? [];

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value || value.messaging_product !== "whatsapp") continue;

      const phoneNumberId: string = value.metadata?.phone_number_id;
      const messages: any[] = value.messages ?? [];
      if (!messages.length || !phoneNumberId) continue;

      // Find site by phone number id
      const site = await prisma.site.findFirst({
        where: { whatsappPhoneNumberId: phoneNumberId },
        select: { id: true, slug: true, chatAgentId: true, whatsappToken: true, whatsappPhoneNumberId: true },
      });
      if (!site || !site.whatsappToken) continue;

      for (const msg of messages) {
        if (msg.type !== "text") {
          // Acknowledge non-text messages
          await sendWhatsAppText(phoneNumberId, site.whatsappToken, msg.from,
            "Solo puedo procesar mensajes de texto por el momento.");
          continue;
        }

        const from: string = msg.from;
        const text: string = msg.text?.body ?? "";
        const waMessageId: string = msg.id;
        const contactName: string = value.contacts?.[0]?.profile?.name ?? from;

        // Mark as read
        await markAsRead(phoneNumberId, site.whatsappToken, waMessageId);

        // Find or create session
        let session = await prisma.siteChatSession.findFirst({
          where: { siteId: site.id, whatsappFrom: from, status: { not: "resolved" } },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        });

        if (!session) {
          session = await prisma.siteChatSession.create({
            data: {
              siteId: site.id,
              clientName: contactName,
              channel: "whatsapp",
              whatsappFrom: from,
              status: "bot",
            },
            include: { messages: { orderBy: { createdAt: "asc" } } },
          });
          sendPushToSite(site.id, {
            title: "Nuevo mensaje de WhatsApp",
            body: `${contactName}: ${text.slice(0, 80)}`,
            url: `/site/${site.slug}/admin/support`,
          }).catch(console.error);
        }

        if (session.status === "resolved") continue;

        // Save user message
        await prisma.siteChatMessage.create({
          data: { sessionId: session.id, role: "user", content: text },
        });
        await prisma.siteChatSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } });

        // If session is with human, don't bot-reply (agent will respond from panel)
        if (session.status === "human") continue;

        // Detect human request keywords
        const humanKeywords = /\b(agente|humano|persona|asesor|operador|hablar con alguien|quiero ayuda humana)\b/i;
        if (session.status === "bot" && humanKeywords.test(text)) {
          await prisma.siteChatSession.update({
            where: { id: session.id },
            data: { status: "waiting" },
          });
          await prisma.siteChatMessage.create({
            data: { sessionId: session.id, role: "system", content: "Solicitud de agente humano recibida." },
          });
          await sendWhatsAppText(phoneNumberId, site.whatsappToken, from,
            "Entendido. Tu solicitud fue enviada a nuestro equipo. En breve un agente se comunicará contigo por aquí.");
          continue;
        }

        if (session.status === "waiting") {
          // Just acknowledge, agent will respond
          continue;
        }

        // Bot mode: AI response
        try {
          const history = (session.messages ?? []).map((m) => ({
            role: (m.role === "bot" ? "assistant" : "user") as "user" | "assistant",
            content: m.content,
          }));
          history.push({ role: "user", content: text });

          let systemPrompt = "Eres un asistente de soporte al cliente útil y amable respondiendo por WhatsApp. Responde en español, texto plano sin markdown ni asteriscos. Respuestas cortas y directas (máximo 3 oraciones). Si el cliente necesita hablar con una persona, dile que escriba la palabra AGENTE.";
          systemPrompt = await buildPublicContext(site.slug, systemPrompt);

          const result = await chat(history, systemPrompt, null);

          await prisma.siteChatMessage.create({
            data: { sessionId: session.id, role: "bot", content: result.text },
          });
          await prisma.siteChatSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } });

          await sendWhatsAppText(phoneNumberId, site.whatsappToken, from, result.text);
        } catch (e) {
          console.error("WA bot error:", e);
          await sendWhatsAppText(phoneNumberId, site.whatsappToken, from,
            "Lo siento, ocurrió un error. Por favor intenta de nuevo.");
        }
      }
    }
  }
}
