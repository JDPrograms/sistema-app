import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string; expenseId: string }> }) {
  const session = await auth();
  const { slug, expenseId } = await params;
  if (!canManage(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  const expense = await prisma.siteExpense.update({
    where: { id: expenseId },
    data: {
      description: body.description,
      amount: Number(body.amount),
      category: body.category || null,
      date: body.date ? new Date(body.date) : new Date(),
      receipt: body.receipt || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(expense);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ slug: string; expenseId: string }> }) {
  const session = await auth();
  const { slug, expenseId } = await params;
  if (!canManage(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await prisma.siteExpense.delete({ where: { id: expenseId } });
  return NextResponse.json({ ok: true });
}
