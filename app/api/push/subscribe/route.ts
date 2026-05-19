import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !user?.siteId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { subscription } = await req.json();
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      siteId: user.siteId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      adminId: user.id ?? null,
    },
    update: {
      siteId: user.siteId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      adminId: user.id ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { endpoint } = await req.json();
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }
  return NextResponse.json({ ok: true });
}
