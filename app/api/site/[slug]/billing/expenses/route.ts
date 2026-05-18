import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!canManage(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const expenses = await prisma.siteExpense.findMany({
    where: { siteId: site.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!canManage(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const expense = await prisma.siteExpense.create({
    data: {
      siteId: site.id,
      description: body.description,
      amount: Number(body.amount),
      category: body.category || null,
      date: body.date ? new Date(body.date) : new Date(),
      receipt: body.receipt || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(expense, { status: 201 });
}
