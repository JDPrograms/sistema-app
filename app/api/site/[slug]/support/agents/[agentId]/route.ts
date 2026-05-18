import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string; agentId: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug, agentId } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const updated = await prisma.siteChatAgent.update({
    where: { id: agentId },
    data: {
      ...(body.isAlwaysOn !== undefined && { isAlwaysOn: body.isAlwaysOn }),
      ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
      ...(body.adminName && { adminName: body.adminName }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string; agentId: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { agentId } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.siteChatAgent.delete({ where: { id: agentId } });
  return NextResponse.json({ ok: true });
}
