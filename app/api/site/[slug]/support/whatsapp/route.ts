import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const site = await prisma.site.findUnique({
    where: { slug },
    select: { whatsappPhoneNumberId: true, whatsappToken: true, whatsappVerifyToken: true, modules: true },
  });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const mods = JSON.parse(site.modules || "{}");
  return NextResponse.json({
    enabled: mods.whatsapp === true,
    phoneNumberId: site.whatsappPhoneNumberId ?? "",
    displayPhoneNumber: (site as any).whatsappDisplayPhone ?? "",
    hasToken: !!site.whatsappToken,
    verifyToken: site.whatsappVerifyToken ?? "",
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, modules: true, whatsappVerifyToken: true },
  });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = {};
  if (body.phoneNumberId !== undefined) data.whatsappPhoneNumberId = body.phoneNumberId || null;
  if (body.displayPhoneNumber !== undefined) (data as any).whatsappDisplayPhone = body.displayPhoneNumber || null;
  if (body.token !== undefined && body.token.trim()) data.whatsappToken = body.token.trim();

  // Auto-generate verify token if not provided and none exists yet
  if (body.verifyToken !== undefined) {
    data.whatsappVerifyToken = body.verifyToken || null;
  } else if (!site.whatsappVerifyToken) {
    data.whatsappVerifyToken = randomBytes(20).toString("hex");
  }

  if (body.enabled !== undefined) {
    const mods = JSON.parse(site.modules || "{}");
    mods.whatsapp = !!body.enabled;
    data.modules = JSON.stringify(mods);
  }

  await prisma.site.update({ where: { slug }, data });
  return NextResponse.json({ ok: true });
}
