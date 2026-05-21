import { NextResponse } from "next/server";
import { chat, buildPublicContext, buildAdminContext } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, agentId, siteSlug, isAdmin } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: "Mensajes requeridos" }, { status: 400 });
    }

    if (isAdmin) {
      // Admin context requires an authenticated session
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      const role = (session.user as any).role;
      if (role !== "superadmin" && role !== "siteadmin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    } else {
      // Public chat widgets: allow but rate-limit by IP (30 req/min)
      const ip = getClientIp(req);
      if (!rateLimit(`ai-chat:${ip}`, 30, 60_000)) {
        return NextResponse.json({ error: "Demasiadas solicitudes. Intenta en un momento." }, { status: 429 });
      }
    }

    let systemPrompt = "Eres un asistente util y amable para la gestion de este negocio. Responde en español, texto plano sin markdown ni listas. Respuestas cortas y directas.";
    let preferredProvider: string | null = null;

    if (agentId) {
      const agent = await prisma.aiAgent.findUnique({ where: { id: agentId } });
      if (agent && agent.isActive) {
        systemPrompt = agent.systemPrompt;
        preferredProvider = agent.preferredProvider ?? null;
      }
    }

    if (siteSlug) {
      systemPrompt = isAdmin
        ? await buildAdminContext(siteSlug, systemPrompt)
        : await buildPublicContext(siteSlug, systemPrompt);
    }

    const result = await chat(messages, systemPrompt, preferredProvider);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Error desconocido" }, { status: 500 });
  }
}
