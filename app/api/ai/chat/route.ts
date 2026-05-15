import { NextResponse } from "next/server";
import { chat, buildPublicContext, buildAdminContext } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, agentId, siteSlug, isAdmin } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: "Mensajes requeridos" }, { status: 400 });
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
