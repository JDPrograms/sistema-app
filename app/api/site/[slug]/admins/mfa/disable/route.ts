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

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Código requerido" }, { status: 400 });

  const admin = await prisma.siteAdmin.findUnique({
    where: { id: user.id },
    select: { mfaSecret: true },
  });
  if (!admin?.mfaSecret) return NextResponse.json({ error: "MFA no configurado" }, { status: 400 });

  const result = await verify({ token: code, secret: admin.mfaSecret });
  if (!result.valid) return NextResponse.json({ error: "Código inválido" }, { status: 400 });

  await prisma.siteAdmin.update({
    where: { id: user.id },
    data: { mfaEnabled: false, mfaSecret: null },
  });

  return NextResponse.json({ ok: true });
}
