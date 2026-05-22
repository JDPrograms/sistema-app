import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = auth(async (req) => {
  if (!req.auth || (req.auth.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? undefined;
  const providers = await prisma.aiProvider.findMany({
    where: scope ? { scope } : undefined,
    orderBy: [{ scope: "asc" }, { priority: "asc" }],
  });
  return NextResponse.json(providers.map((p) => ({ ...p, hasKey: p.apiKey.length > 0, apiKey: undefined })));
});

export const POST = auth(async (req) => {
  if (!req.auth || (req.auth.user as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const scope: string = body.scope ?? "global";
  const hasNewKey = typeof body.apiKey === "string" && body.apiKey.trim().length > 0;
  const provider = await prisma.aiProvider.upsert({
    where: { name_scope: { name: body.name, scope } },
    create: {
      name: body.name,
      label: body.label,
      apiKey: body.apiKey ?? "",
      model: body.model ?? "",
      isActive: body.isActive ?? false,
      priority: body.priority ?? 0,
      scope,
    },
    update: {
      label: body.label,
      model: body.model ?? "",
      isActive: body.isActive ?? false,
      priority: body.priority ?? 0,
      ...(hasNewKey && { apiKey: body.apiKey.trim() }),
    },
  });
  return NextResponse.json({ ...provider, hasKey: provider.apiKey.length > 0, apiKey: undefined });
});
