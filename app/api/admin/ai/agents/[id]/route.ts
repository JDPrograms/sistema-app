import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const PATCH = auth(async (req, ctx) => {
  if (!req.auth || (req.auth.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await (ctx as any).params;
  const body = await req.json();
  const agent = await prisma.aiAgent.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.systemPrompt !== undefined && { systemPrompt: body.systemPrompt }),
      ...(body.preferredProvider !== undefined && { preferredProvider: body.preferredProvider || null }),
      ...(body.isGlobal !== undefined && { isGlobal: body.isGlobal }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });
  return NextResponse.json(agent);
});

export const DELETE = auth(async (req, ctx) => {
  if (!req.auth || (req.auth.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await (ctx as any).params;
  await prisma.aiAgent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
