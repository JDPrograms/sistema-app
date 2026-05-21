import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { parseSuperPerms } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const superAdmin = await prisma.superAdmin.findUnique({ where: { id: user.id } });
  if (!superAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const perms = parseSuperPerms(superAdmin.permissions, superAdmin.isMaster);
  if (!perms.canImpersonate) return NextResponse.json({ error: "Sin permiso de impersonar" }, { status: 403 });

  const { adminId, siteSlug } = await req.json();
  const siteAdmin = await prisma.siteAdmin.findFirst({
    where: { id: adminId },
    include: { site: { select: { slug: true } } },
  });
  if (!siteAdmin) return NextResponse.json({ error: "Admin no encontrado" }, { status: 404 });

  const slug = siteSlug || siteAdmin.site.slug;

  // Return a signed token that will be used with NextAuth's credentials provider
  // For now return the redirect URL to the site admin with a special superadmin session override
  return NextResponse.json({
    ok: true,
    redirectTo: `/site/${slug}/admin`,
    message: "Como superadmin ya tienes acceso directo al panel del sitio",
    siteAdminInfo: { name: siteAdmin.name, email: siteAdmin.email, slug },
  });
}
