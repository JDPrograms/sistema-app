import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export const PATCH = auth(async (req, ctx) => {
  const { slug } = await (ctx as any).params;
  if (!canManage(req.auth, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const site = await prisma.site.update({
    where: { slug },
    data: {
      ...(body.chatAgentId !== undefined && { chatAgentId: body.chatAgentId || null }),
      ...(body.adminAgentId !== undefined && { adminAgentId: body.adminAgentId || null }),
    },
  });
  return NextResponse.json({ chatAgentId: site.chatAgentId, adminAgentId: site.adminAgentId });
});
