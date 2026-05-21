import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ip = getClientIp(req);
  if (!rateLimit(`pre-login-siteadmin:${ip}`, 5, 60_000)) {
    return NextResponse.json({ valid: false }, { status: 429 });
  }

  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ valid: false });

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ valid: false });

  const admin = await prisma.siteAdmin.findUnique({
    where: { email_siteId: { email: email.trim().toLowerCase(), siteId: site.id } },
    select: { password: true, mfaEnabled: true },
  });
  if (!admin) return NextResponse.json({ valid: false });

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return NextResponse.json({ valid: false });

  return NextResponse.json({ valid: true, mfaRequired: admin.mfaEnabled });
}
