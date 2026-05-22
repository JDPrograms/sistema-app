import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const PATCH = auth(async (req, ctx) => {
  if (!req.auth || (req.auth.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await (ctx as any).params;
  const { status, adminNote } = await req.json() as { status: string; adminNote?: string };

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const request = await prisma.planRequest.update({
    where: { id },
    data: { status, adminNote: adminNote?.trim() || null },
    include: { site: { select: { name: true, slug: true } } },
  });

  return NextResponse.json(request);
});
