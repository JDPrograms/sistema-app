import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const email = session.user?.email ?? "superadmin";
  const secret = generateSecret();
  const otpauthUrl = generateURI({ label: email, issuer: "Sistema de Sistemas", secret });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return NextResponse.json({ secret, qrDataUrl });
}
