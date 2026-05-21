import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, isActive: true } });
  if (!site || !site.isActive) return NextResponse.json({ staff: [] });

  const staff = await prisma.siteStaff.findMany({
    where: { siteId: site.id, isActive: true },
    select: { id: true, name: true, specialty: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ staff });
}
