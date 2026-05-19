import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  if (!domain) return NextResponse.json({ slug: null });

  const site = await prisma.site.findFirst({
    where: { customDomain: domain, isActive: true },
    select: { slug: true },
  });

  return NextResponse.json(
    { slug: site?.slug ?? null },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } }
  );
}
