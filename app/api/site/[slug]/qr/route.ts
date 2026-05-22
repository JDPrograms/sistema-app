import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const site = await prisma.site.findUnique({ where: { slug }, select: { isActive: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const siteUrl = `${process.env.NEXTAUTH_URL ?? baseUrl}/site/${slug}`;

  const buffer = await QRCode.toBuffer(siteUrl, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
      "Content-Disposition": `inline; filename="qr-${slug}.png"`,
    },
  });
}
