import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { slug } = await params;
  if (role === "siteadmin" && (session.user as any).siteSlug !== slug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.site.update({
    where: { slug },
    data: { onboardingCompleted: true },
  });

  return NextResponse.json({ ok: true });
}
