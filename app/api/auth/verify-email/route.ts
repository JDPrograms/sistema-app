import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const slug = url.searchParams.get("slug");

  if (!token || !slug) {
    return NextResponse.redirect(new URL(`/site/${slug || ""}/login?error=invalid`, req.url));
  }

  const user = await prisma.siteUser.findFirst({ where: { verifyToken: token } });
  if (!user) {
    return NextResponse.redirect(new URL(`/site/${slug}/login?error=invalid`, req.url));
  }

  await prisma.siteUser.update({
    where: { id: user.id },
    data: { emailVerified: true, verifyToken: null },
  });

  return NextResponse.redirect(new URL(`/site/${slug}/login?verified=1`, req.url));
}
