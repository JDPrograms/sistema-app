import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ valid: false });

  const admin = await prisma.superAdmin.findUnique({
    where: { email },
    select: { password: true, mfaEnabled: true },
  });
  if (!admin) return NextResponse.json({ valid: false });

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return NextResponse.json({ valid: false });

  return NextResponse.json({ valid: true, mfaRequired: admin.mfaEnabled });
}
