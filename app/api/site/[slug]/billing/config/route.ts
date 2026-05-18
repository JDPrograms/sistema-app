import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const site = await prisma.site.findUnique({ where: { slug }, select: { billingConfig: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try { return NextResponse.json(JSON.parse((site as any).billingConfig || "{}")); }
  catch { return NextResponse.json({}); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (role === "siteadmin" && (session.user as any).siteSlug !== slug) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();
  await prisma.site.update({ where: { slug }, data: { billingConfig: JSON.stringify(body) } });
  return NextResponse.json(body);
}
