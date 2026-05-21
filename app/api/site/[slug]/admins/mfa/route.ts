import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "siteadmin" || user?.siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = await prisma.siteAdmin.findUnique({
    where: { id: user.id },
    select: { mfaEnabled: true },
  });
  return NextResponse.json({ mfaEnabled: admin?.mfaEnabled ?? false });
}
