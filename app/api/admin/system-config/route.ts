import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { parseSuperPerms } from "@/lib/permissions";

async function checkMaster(session: any) {
  const user = session?.user as any;
  if (user?.role !== "superadmin") return null;
  const admin = await prisma.superAdmin.findUnique({ where: { id: user.id } });
  if (!admin) return null;
  const perms = parseSuperPerms(admin.permissions, admin.isMaster);
  if (!perms.canManageSystem) return null;
  return admin;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!await checkMaster(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const configs = await prisma.systemConfig.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  return NextResponse.json({ configs });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!await checkMaster(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key, value, label, group } = await req.json();
  if (!key) return NextResponse.json({ error: "Key requerido" }, { status: 400 });

  const config = await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value: String(value), label, group },
    update: { value: String(value), label, group },
  });
  return NextResponse.json({ config });
}
