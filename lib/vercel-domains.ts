const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const API = "https://api.vercel.com";

export async function addDomainToVercel(domain: string) {
  if (!VERCEL_TOKEN || !PROJECT_ID) {
    throw new Error("VERCEL_API_TOKEN o VERCEL_PROJECT_ID no configurados");
  }
  const res = await fetch(`${API}/v10/projects/${PROJECT_ID}/domains`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: domain }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "No se pudo agregar el dominio en Vercel");
  return data;
}

export async function removeDomainFromVercel(domain: string) {
  if (!VERCEL_TOKEN || !PROJECT_ID) return;
  await fetch(`${API}/v9/projects/${PROJECT_ID}/domains/${domain}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  }).catch(() => {});
}

export async function getDomainStatus(domain: string) {
  if (!VERCEL_TOKEN || !PROJECT_ID) return null;
  const res = await fetch(`${API}/v10/projects/${PROJECT_ID}/domains/${domain}`, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });
  if (!res.ok) return null;
  return res.json();
}
