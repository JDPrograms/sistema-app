import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string; queueId: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug, queueId } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, description, isDefault, addAgentId, removeAgentId } = body;

  // If setting as default, unset others first
  if (isDefault) {
    await prisma.supportQueue.updateMany({ where: { siteId: site.id, isDefault: true }, data: { isDefault: false } });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (isDefault !== undefined) data.isDefault = !!isDefault;

  // Add or remove agent from this queue
  if (addAgentId) {
    data.agents = { connect: { id: addAgentId } };
  }
  if (removeAgentId) {
    data.agents = { disconnect: { id: removeAgentId } };
  }

  const queue = await prisma.supportQueue.update({
    where: { id: queueId },
    data,
    include: {
      agents: { select: { id: true, adminId: true, adminName: true, isAlwaysOn: true, isAvailable: true } },
    },
  });
  return NextResponse.json(queue);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string; queueId: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug, queueId } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.supportQueue.delete({ where: { id: queueId } });
  return NextResponse.json({ ok: true });
}
