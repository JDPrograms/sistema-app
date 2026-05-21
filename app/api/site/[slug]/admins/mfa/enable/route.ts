import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verify } from "otplib";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "siteadmin" || user?.siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { code, secret } = await req.json();
  if (!code || !secret) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const result = await verify({ token: code, secret });
  if (!result.valid) return NextResponse.json({ error: "Código inválido" }, { status: 400 });

  await prisma.siteAdmin.update({
    where: { id: user.id },
    data: { mfaEnabled: true, mfaSecret: secret },
  });

  return NextResponse.json({ ok: true });
}
