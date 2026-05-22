import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  // Raw SQL fallback for pageBlocks and layoutConfig
  const rawExtra = await prisma.$queryRaw<{ pageBlocks: string | null; layoutConfig: string | null }[]>`
    SELECT "pageBlocks", "layoutConfig" FROM "Site" WHERE slug = ${slug}
  `;
  (site as any).pageBlocks = rawExtra[0]?.pageBlocks ?? "[]";
  (site as any).layoutConfig = rawExtra[0]?.layoutConfig ?? null;
  return NextResponse.json(site);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { slug } = await params;
  const body = await req.json();

  if (role === "siteadmin" && (session.user as any).siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description ?? null;
  if (body.primaryColor !== undefined) data.primaryColor = body.primaryColor;
  if (body.secondaryColor !== undefined) data.secondaryColor = body.secondaryColor;
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl ?? null;
  if (body.phone !== undefined) data.phone = body.phone ?? null;
  if (body.address !== undefined) data.address = body.address ?? null;
  if (body.email !== undefined) data.email = body.email ?? null;
  if (body.whatsapp !== undefined) data.whatsapp = body.whatsapp ?? null;
  if (body.mapUrl !== undefined) data.mapUrl = body.mapUrl ?? null;
  if (body.socialLinks !== undefined) data.socialLinks = typeof body.socialLinks === "string" ? body.socialLinks : JSON.stringify(body.socialLinks ?? {});
  if (body.businessHours !== undefined) data.businessHours = typeof body.businessHours === "string" ? body.businessHours : JSON.stringify(body.businessHours ?? []);
  if (body.seoTitle !== undefined) data.seoTitle = body.seoTitle ?? null;
  if (body.seoDescription !== undefined) data.seoDescription = body.seoDescription ?? null;
  if (body.emailFrom !== undefined) data.emailFrom = body.emailFrom ?? null;
  if (body.emailApiKey !== undefined && body.emailApiKey.trim()) data.emailApiKey = body.emailApiKey.trim();
  if (body.template !== undefined) data.template = body.template;
  // Extract pageBlocks and layoutConfig to handle via raw SQL (avoids Prisma binary schema mismatch)
  const pageBlocksValue = body.pageBlocks !== undefined
    ? (typeof body.pageBlocks === "string" ? body.pageBlocks : JSON.stringify(body.pageBlocks ?? []))
    : undefined;
  const layoutConfigValue = body.layoutConfig !== undefined
    ? (typeof body.layoutConfig === "string" ? body.layoutConfig : JSON.stringify(body.layoutConfig ?? null))
    : undefined;

  let site: any;
  if (Object.keys(data).length > 0) {
    site = await prisma.site.update({ where: { slug }, data });
  } else {
    site = await prisma.site.findUnique({ where: { slug } });
    if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (pageBlocksValue !== undefined) {
    await prisma.$executeRaw`UPDATE "Site" SET "pageBlocks" = ${pageBlocksValue} WHERE slug = ${slug}`;
    (site as any).pageBlocks = pageBlocksValue;
  }

  if (layoutConfigValue !== undefined) {
    await prisma.$executeRaw`UPDATE "Site" SET "layoutConfig" = ${layoutConfigValue} WHERE slug = ${slug}`;
    (site as any).layoutConfig = layoutConfigValue;
  }

  return NextResponse.json(site);
}
