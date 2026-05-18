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

  const { code, secret } = await req.json();
  if (!code || !secret) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  try {
    const result = await verify({ token: code, secret });
    if (!result.valid) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    const id = (session.user as any).id as string;
    await prisma.superAdmin.update({
      where: { id },
      data: { mfaEnabled: true, mfaSecret: secret },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 });
  }
}
