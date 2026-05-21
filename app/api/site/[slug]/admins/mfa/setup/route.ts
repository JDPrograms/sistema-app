import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";

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

  const email = session.user?.email ?? "admin";
  const secret = generateSecret();
  const otpauthUrl = generateURI({ label: email, issuer: "Sistema de Sistemas", secret });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return NextResponse.json({ secret, qrDataUrl });
}
