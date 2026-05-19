import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { subscribeWABAToApp, registerWebhook } from "@/lib/whatsapp";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const site = await prisma.site.findUnique({
    where: { slug },
    select: {
      whatsappPhoneNumberId: true,
      whatsappDisplayPhone: true,
      whatsappToken: true,
      whatsappVerifyToken: true,
      whatsappAppId: true,
      whatsappAppSecret: true,
      modules: true,
    },
  });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const mods = JSON.parse(site.modules || "{}");
  return NextResponse.json({
    enabled: mods.whatsapp === true,
    phoneNumberId: site.whatsappPhoneNumberId ?? "",
    displayPhoneNumber: site.whatsappDisplayPhone ?? "",
    hasToken: !!site.whatsappToken,
    verifyToken: site.whatsappVerifyToken ?? "",
    appId: site.whatsappAppId ?? "",
    hasAppSecret: !!site.whatsappAppSecret,
    webhookAutoConfigured: !!(site.whatsappAppId && site.whatsappAppSecret),
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const site = await prisma.site.findUnique({
    where: { slug },
    select: {
      id: true,
      modules: true,
      whatsappVerifyToken: true,
      whatsappAppId: true,
      whatsappAppSecret: true,
    },
  });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = {};
  if (body.phoneNumberId !== undefined) data.whatsappPhoneNumberId = body.phoneNumberId || null;
  if (body.displayPhoneNumber !== undefined) data.whatsappDisplayPhone = body.displayPhoneNumber || null;
  if (body.wabaId !== undefined) data.whatsappWabaId = body.wabaId || null;
  if (body.token !== undefined && body.token.trim()) data.whatsappToken = body.token.trim();
  if (body.appId !== undefined) data.whatsappAppId = body.appId.trim() || null;
  if (body.appSecret !== undefined && body.appSecret.trim()) data.whatsappAppSecret = body.appSecret.trim();

  const verifyToken =
    body.verifyToken?.trim() ||
    site.whatsappVerifyToken ||
    randomBytes(20).toString("hex");
  data.whatsappVerifyToken = verifyToken;

  if (body.enabled !== undefined) {
    const mods = JSON.parse(site.modules || "{}");
    mods.whatsapp = !!body.enabled;
    data.modules = JSON.stringify(mods);
  }

  // Save first — verify token must be in DB before Meta calls our GET to verify
  await prisma.site.update({ where: { slug }, data });

  const automationResults: { wabaSubscribed?: boolean; webhookRegistered?: boolean; errors: string[] } = {
    errors: [],
  };

  const token = body.token?.trim() || "";
  const wabaId = body.wabaId?.trim() || "";

  if (token && wabaId) {
    try {
      await subscribeWABAToApp(wabaId, token);
      automationResults.wabaSubscribed = true;
    } catch (e: any) {
      automationResults.errors.push(`WABA: ${e.message}`);
    }
  }

  // Use per-site App ID/Secret (prefer new values from body, fall back to DB)
  const appId = body.appId?.trim() || site.whatsappAppId || "";
  const appSecret = body.appSecret?.trim() || site.whatsappAppSecret || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (appId && appSecret && appUrl) {
    try {
      const callbackUrl = `${appUrl}/api/webhooks/whatsapp`;
      await registerWebhook(appId, appSecret, callbackUrl, verifyToken);
      automationResults.webhookRegistered = true;
    } catch (e: any) {
      automationResults.errors.push(`Webhook: ${e.message}`);
    }
  }

  return NextResponse.json({ ok: true, automation: automationResults });
}
