import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; adId: string }> }
) {
  const session = await auth();
  const { slug, adId } = await params;
  if (!canManage(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const ad = await prisma.siteAd.update({
    where: { id: adId },
    data: {
      title: body.title,
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
      linkUrl: body.linkUrl ?? null,
      buttonText: body.buttonText ?? null,
      type: body.type,
      isActive: body.isActive,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(ad);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ slug: string; adId: string }> }
) {
  const session = await auth();
  const { slug, adId } = await params;
  if (!canManage(session, slug)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await prisma.siteAd.delete({ where: { id: adId } });
  return NextResponse.json({ ok: true });
}
