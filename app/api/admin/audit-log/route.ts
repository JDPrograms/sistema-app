import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 200);
  const page = Number(searchParams.get("page") || "1");

  const [logs, total] = await prisma.$transaction([
    prisma.superAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.superAuditLog.count(),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, entityType, entityId, details } = await req.json();
  const user = session?.user as any;

  const log = await prisma.superAuditLog.create({
    data: {
      action, entityType, entityId,
      details: details ? JSON.stringify(details) : null,
      actorId: user?.id, actorEmail: user?.email, actorName: user?.name,
    },
  });
  return NextResponse.json({ log });
}
