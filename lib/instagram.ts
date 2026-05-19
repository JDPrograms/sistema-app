const IG_API = "https://graph.facebook.com/v20.0";

export async function sendInstagramMessage(recipientId: string, token: string, text: string) {
  const res = await fetch(`${IG_API}/me/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Error enviando mensaje de Instagram");
  return data;
}
