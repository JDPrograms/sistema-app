import webpush from "web-push";
import { prisma } from "./prisma";

webpush.setVapidDetails(
  "mailto:admin@sistema.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushToSite(siteId: string, payload: { title: string; body: string; url?: string }) {
  const subs = await prisma.pushSubscription.findMany({ where: { siteId } });
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );

  // Remove expired/invalid subscriptions
  const toDelete: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const status = (r.reason as any)?.statusCode;
      if (status === 404 || status === 410) toDelete.push(subs[i].endpoint);
    }
  });
  if (toDelete.length) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: toDelete } } });
  }
}
