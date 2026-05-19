import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSiteAndCheck(slug: string) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== "siteadmin" && role !== "superadmin")) return null;
  if (role === "siteadmin" && (session.user as any).siteSlug !== slug) return null;

  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, pwaShortName: true, twaPackageName: true, twaFingerprint: true, primaryColor: true, logoUrl: true, modules: true },
  });
  return site;
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteAndCheck(slug);
  if (!site) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({
    pwaShortName: site.pwaShortName ?? "",
    twaPackageName: site.twaPackageName ?? "",
    twaFingerprint: site.twaFingerprint ?? "",
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteAndCheck(slug);
  if (!site) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  await prisma.site.update({
    where: { id: site.id },
    data: {
      ...(body.pwaShortName !== undefined && { pwaShortName: body.pwaShortName || null }),
      ...(body.twaPackageName !== undefined && { twaPackageName: body.twaPackageName || null }),
      ...(body.twaFingerprint !== undefined && { twaFingerprint: body.twaFingerprint || null }),
    },
  });
  return NextResponse.json({ ok: true });
}
