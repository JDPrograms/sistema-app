import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import React from "react";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({
    where: { slug },
    select: { name: true, primaryColor: true },
  });

  const color = site?.primaryColor || "#3b82f6";
  const letter = (site?.name || slug).charAt(0).toUpperCase();

  return new ImageResponse(
    React.createElement("div", {
      style: {
        width: 192, height: 192,
        background: color,
        borderRadius: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 96,
        fontWeight: 700,
        color: "#ffffff",
      },
    }, letter),
    { width: 192, height: 192 }
  );
}
