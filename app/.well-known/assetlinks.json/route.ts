import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    // Return empty array if no slug — generic response
    return NextResponse.json([], { headers: { "Content-Type": "application/json" } });
  }

  const site = await prisma.site.findUnique({
    where: { slug },
    select: { twaPackageName: true, twaFingerprint: true, pwaEnabled: true },
  });

  if (!site?.pwaEnabled || !site.twaPackageName || !site.twaFingerprint) {
    return NextResponse.json([], { headers: { "Content-Type": "application/json" } });
  }

  const assetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: site.twaPackageName,
        sha256_cert_fingerprints: [site.twaFingerprint],
      },
    },
  ];

  return NextResponse.json(assetLinks, {
    headers: { "Content-Type": "application/json" },
  });
}
