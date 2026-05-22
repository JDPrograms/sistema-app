import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH — admin: update session status (resolve / reopen)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; sessionId: string }> }
) {
  const authSession = await auth();
  const role = (authSession?.user as any)?.role;
  if (!authSession || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { slug, sessionId } = await params;
  if (role === "siteadmin" && (authSession.user as any).siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { status } = await req.json();
  if (!["waiting", "human", "resolved"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const updated = await prisma.siteChatSession.updateMany({
    where: { id: sessionId, siteId: site.id },
    data: { status },
  });

  if (!updated.count) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (status === "resolved") {
    await prisma.siteChatMessage.create({
      data: {
        sessionId,
        role: "system",
        content: "Sesión cerrada por el agente.",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
