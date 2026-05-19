import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const site = await prisma.site.findUnique({
    where: { slug },
    select: {
      instagramUserId: true,
      instagramToken: true,
      instagramVerifyToken: true,
      modules: true,
    },
  });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const mods = JSON.parse(site.modules || "{}");
  return NextResponse.json({
    enabled: mods.instagram === true,
    instagramUserId: site.instagramUserId ?? "",
    hasToken: !!site.instagramToken,
    verifyToken: site.instagramVerifyToken ?? "",
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, modules: true, instagramVerifyToken: true },
  });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = {};
  if (body.instagramUserId !== undefined) data.instagramUserId = body.instagramUserId?.trim() || null;
  if (body.token !== undefined && body.token.trim()) data.instagramToken = body.token.trim();

  const verifyToken =
    body.verifyToken?.trim() ||
    site.instagramVerifyToken ||
    randomBytes(20).toString("hex");
  data.instagramVerifyToken = verifyToken;

  if (body.enabled !== undefined) {
    const mods = JSON.parse(site.modules || "{}");
    mods.instagram = !!body.enabled;
    data.modules = JSON.stringify(mods);
  }

  await prisma.site.update({ where: { slug }, data });
  return NextResponse.json({ ok: true, verifyToken });
}
