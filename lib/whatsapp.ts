const WA_API = "https://graph.facebook.com/v20.0";

export async function subscribeWABAToApp(wabaId: string, token: string) {
  const res = await fetch(`${WA_API}/${wabaId}/subscribed_apps`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "No se pudo suscribir el WABA");
  return data;
}

export async function registerWebhook(callbackUrl: string, verifyToken: string) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("META_APP_ID o META_APP_SECRET no configurados");

  const appToken = `${appId}|${appSecret}`;
  const body = new URLSearchParams({
    object: "whatsapp_business_account",
    callback_url: callbackUrl,
    verify_token: verifyToken,
    fields: "messages",
  });

  const res = await fetch(`${WA_API}/${appId}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "No se pudo registrar el webhook");
  return data;
}

export async function sendWhatsAppText(phoneNumberId: string, token: string, to: string, text: string) {
  const res = await fetch(`${WA_API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`);
  }
  return res.json();
}

export async function markAsRead(phoneNumberId: string, token: string, messageId: string) {
  await fetch(`${WA_API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  }).catch(() => {});
}
