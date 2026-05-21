import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; adminId: string }> }
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: siteId, adminId } = await params;
  const { permissions } = await req.json();

  const admin = await prisma.siteAdmin.findFirst({ where: { id: adminId, siteId } });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (admin.isOwner) return NextResponse.json({ error: "Cannot restrict site owner" }, { status: 400 });

  await prisma.siteAdmin.update({
    where: { id: adminId },
    data: { permissions: JSON.stringify(permissions ?? {}) },
  });

  return NextResponse.json({ ok: true });
}
