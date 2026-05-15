import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export const GET = auth(async (req, ctx) => {
  const { slug } = await (ctx as any).params;
  if (!canManage(req.auth, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const [siteAgents, globalAgents] = await Promise.all([
    prisma.aiAgent.findMany({ where: { siteId: site.id }, orderBy: { createdAt: "desc" } }),
    prisma.aiAgent.findMany({ where: { isGlobal: true, isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ siteAgents, globalAgents, chatAgentId: site.chatAgentId, adminAgentId: site.adminAgentId });
});

export const POST = auth(async (req, ctx) => {
  const { slug } = await (ctx as any).params;
  if (!canManage(req.auth, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json();
  if (!body.name?.trim() || !body.systemPrompt?.trim()) {
    return NextResponse.json({ error: "Nombre y prompt requeridos" }, { status: 400 });
  }

  const agent = await prisma.aiAgent.create({
    data: {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      systemPrompt: body.systemPrompt.trim(),
      preferredProvider: body.preferredProvider || null,
      agentType: body.agentType ?? "general",
      isGlobal: false,
      isActive: true,
      siteId: site.id,
    },
  });
  return NextResponse.json(agent, { status: 201 });
});
