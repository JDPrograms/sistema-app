import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyDirector } from "@/lib/director-notify";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const site = await prisma.site.findUnique({
    where: { id },
    include: { admins: true, _count: { select: { users: true } } },
  });
  if (!site) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(site);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  // Read current state before update to detect isActive changes
  const prev = body.isActive !== undefined
    ? await prisma.site.findUnique({ where: { id }, select: { isActive: true, name: true, slug: true } })
    : null;

  const site = await prisma.site.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.modules !== undefined && { modules: body.modules }),
      ...(body.hasAdminPanel !== undefined && { hasAdminPanel: body.hasAdminPanel }),
      ...(body.planType !== undefined && { planType: body.planType }),
      ...(body.expiresAt !== undefined && { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }),
      ...(body.expiryReason !== undefined && { expiryReason: body.expiryReason }),
      ...(body.pwaEnabled !== undefined && { pwaEnabled: body.pwaEnabled }),
      ...(body.pwaShortName !== undefined && { pwaShortName: body.pwaShortName }),
      ...(body.twaPackageName !== undefined && { twaPackageName: body.twaPackageName }),
      ...(body.twaFingerprint !== undefined && { twaFingerprint: body.twaFingerprint }),
    },
  });

  if (prev && body.isActive !== undefined && prev.isActive !== body.isActive) {
    if (body.isActive === false) {
      notifyDirector({
        event: "site_deactivated",
        title: `Sitio desactivado: ${site.name}`,
        body: `El sitio "${site.name}" (/${site.slug}) fue desactivado.`,
        dedupKey: site.id,
        cooldownMinutes: 60,
      }).catch(() => {});
    } else {
      notifyDirector({
        event: "site_reactivated",
        title: `Sitio reactivado: ${site.name}`,
        body: `El sitio "${site.name}" (/${site.slug}) fue reactivado.`,
        dedupKey: site.id,
        cooldownMinutes: 60,
      }).catch(() => {});
    }
  }

  return NextResponse.json(site);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const site = await prisma.site.findUnique({ where: { id }, select: { name: true, slug: true } });
  await prisma.site.delete({ where: { id } });

  if (site) {
    notifyDirector({
      event: "site_deleted",
      title: `Sitio eliminado: ${site.name}`,
      body: `El sitio "${site.name}" (/${site.slug}) fue eliminado permanentemente.`,
      dedupKey: id,
      cooldownMinutes: 0,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
