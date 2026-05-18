import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Public GET — clients need to see queue names for selection
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const queues = await prisma.supportQueue.findMany({
    where: { siteId: site.id },
    include: {
      agents: { select: { id: true, adminId: true, adminName: true, adminEmail: true, isAlwaysOn: true, isAvailable: true } },
      _count: { select: { sessions: true } },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(queues);
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, description, isDefault } = body;
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  // If setting as default, unset any previous default
  if (isDefault) {
    await prisma.supportQueue.updateMany({ where: { siteId: site.id, isDefault: true }, data: { isDefault: false } });
  }

  const queue = await prisma.supportQueue.create({
    data: { siteId: site.id, name: name.trim(), description: description?.trim() || null, isDefault: !!isDefault },
  });
  return NextResponse.json(queue, { status: 201 });
}
