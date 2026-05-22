import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = auth(async (req) => {
  if (!req.auth || (req.auth.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;

  const requests = await prisma.planRequest.findMany({
    where: status ? { status } : undefined,
    include: { site: { select: { name: true, slug: true, planType: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
});
