"use client";
import { useEffect } from "react";

export function PushSubscriber() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function subscribe() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");

        const existing = await reg.pushManager.getSubscription();
        if (existing) return; // already subscribed

        const keyRes = await fetch("/api/push/vapid-key");
        const { publicKey } = await keyRes.json();
        if (!publicKey) return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub }),
        });
      } catch {
        // Permission denied or not supported — fail silently
      }
    }

    subscribe();
  }, []);

  return null;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
