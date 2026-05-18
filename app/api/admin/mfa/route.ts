import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const id = (session.user as any).id as string;
  const admin = await prisma.superAdmin.findUnique({ where: { id }, select: { mfaEnabled: true } });
  return NextResponse.json({ mfaEnabled: admin?.mfaEnabled ?? false });
}
