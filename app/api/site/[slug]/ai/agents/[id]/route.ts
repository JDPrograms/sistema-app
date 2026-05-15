import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export const PATCH = auth(async (req, ctx) => {
  const { slug, id } = await (ctx as any).params;
  if (!canManage(req.auth, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  const agent = await prisma.aiAgent.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.systemPrompt !== undefined && { systemPrompt: body.systemPrompt }),
      ...(body.preferredProvider !== undefined && { preferredProvider: body.preferredProvider || null }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });
  return NextResponse.json(agent);
});

export const DELETE = auth(async (req, ctx) => {
  const { slug, id } = await (ctx as any).params;
  if (!canManage(req.auth, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await prisma.aiAgent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
