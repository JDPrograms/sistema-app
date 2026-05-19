import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const META_API = "https://graph.facebook.com/v20.0";

async function fetchPhoneNumbers(token: string) {
  const meRes = await fetch(`${META_API}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const me = await meRes.json();
  if (me.error || !me.id) throw new Error(me.error?.message || "Token inválido");

  const phones: { id: string; displayPhoneNumber: string; verifiedName: string; wabaId: string }[] = [];
  const seen = new Set<string>();

  function addPhone(p: { id: string; display_phone_number: string; verified_name: string }, wabaId: string) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      phones.push({
        id: p.id,
        displayPhoneNumber: p.display_phone_number,
        verifiedName: p.verified_name,
        wabaId,
      });
    }
  }

  async function loadFromWABA(wabaId: string) {
    const r = await fetch(
      `${META_API}/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const d = await r.json();
    for (const p of d.data || []) addPhone(p, wabaId);
  }

  const bizRes = await fetch(`${META_API}/${me.id}/businesses?fields=id`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const biz = await bizRes.json();

  for (const b of biz.data || []) {
    const owned = await fetch(`${META_API}/${b.id}/owned_whatsapp_business_accounts?fields=id`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    for (const w of (await owned.json()).data || []) await loadFromWABA(w.id);

    const client = await fetch(`${META_API}/${b.id}/client_whatsapp_business_accounts?fields=id`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    for (const w of (await client.json()).data || []) await loadFromWABA(w.id);
  }

  return phones;
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { token } = await req.json();
  if (!token?.trim()) return NextResponse.json({ error: "Token requerido" }, { status: 400 });

  try {
    const phones = await fetchPhoneNumbers(token.trim());
    return NextResponse.json({ phones });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al conectar con Meta" }, { status: 400 });
  }
}
