const WA_API = "https://graph.facebook.com/v20.0";

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
