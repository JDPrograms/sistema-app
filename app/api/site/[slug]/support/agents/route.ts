import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const agents = await prisma.siteChatAgent.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(agents);
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
  const { adminId, adminName, adminEmail, isAlwaysOn } = body;

  if (!adminId || !adminName || !adminEmail) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const agent = await prisma.siteChatAgent.upsert({
    where: { siteId_adminId: { siteId: site.id, adminId } },
    update: { adminName, adminEmail, isAlwaysOn: !!isAlwaysOn },
    create: { siteId: site.id, adminId, adminName, adminEmail, isAlwaysOn: !!isAlwaysOn },
  });
  return NextResponse.json(agent, { status: 201 });
}
