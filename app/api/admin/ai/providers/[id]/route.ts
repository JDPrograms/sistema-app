import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const PATCH = auth(async (req, ctx) => {
  if (!req.auth || (req.auth.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await (ctx as any).params;
  const body = await req.json();
  const updated = await prisma.aiProvider.update({
    where: { id },
    data: {
      ...(body.apiKey?.trim?.() && { apiKey: body.apiKey.trim() }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.priority !== undefined && { priority: body.priority }),
    },
  });
  return NextResponse.json({ ...updated, hasKey: updated.apiKey.length > 0, apiKey: undefined });
});
