import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function checkAdmin(slug: string, session: any) {
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return null;
  const role = session?.user?.role;
  if (role === "superadmin") return site;
  if (role === "siteadmin" && session.user.siteSlug === slug) return site;
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tasks = await prisma.siteTask.findMany({
    where: { siteId: site.id },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, priority, assignedTo, dueDate } = await req.json();
  if (!title) return NextResponse.json({ error: "Título requerido" }, { status: 400 });

  const task = await prisma.siteTask.create({
    data: {
      siteId: site.id, title, description, priority: priority || "normal",
      assignedTo, dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: (session?.user as any)?.name || undefined,
    },
  });
  return NextResponse.json({ task });
}
