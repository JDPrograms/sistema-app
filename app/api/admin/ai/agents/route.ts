import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = auth(async (req) => {
  if (!req.auth || (req.auth.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const agents = await prisma.aiAgent.findMany({
    include: { site: { select: { name: true, slug: true } } },
    orderBy: [{ isGlobal: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(agents);
});

export const POST = auth(async (req) => {
  if (!req.auth || (req.auth.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
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
      isGlobal: body.isGlobal ?? true,
      isActive: body.isActive ?? true,
      siteId: body.siteId || null,
    },
  });
  return NextResponse.json(agent, { status: 201 });
});
