import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verify } from "otplib";

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Código requerido" }, { status: 400 });

  const id = (session.user as any).id as string;
  const admin = await prisma.superAdmin.findUnique({ where: { id }, select: { mfaSecret: true } });
  if (!admin?.mfaSecret) {
    return NextResponse.json({ error: "MFA no configurado" }, { status: 400 });
  }

  try {
    const result = await verify({ token: code, secret: admin.mfaSecret });
    if (!result.valid) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    await prisma.superAdmin.update({
      where: { id },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 });
  }
}
