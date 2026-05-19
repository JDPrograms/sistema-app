import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const META_API = "https://graph.facebook.com/v20.0";

async function fetchPhoneNumbers(token: string, manualWabaId?: string) {
  // Validate token
  const meRes = await fetch(`${META_API}/me?fields=id,name,granular_scopes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const me = await meRes.json();
  if (me.error || !me.id) throw new Error(me.error?.message || "Token inválido o expirado");

  const wabaIds = new Set<string>();

  // If user provided a manual WABA ID, use it directly
  if (manualWabaId?.trim()) {
    wabaIds.add(manualWabaId.trim());
  }

  // Method 1: granular_scopes — best for permanent System User tokens
  // Returns the WABA IDs the token has whatsapp_business_management permission for
  if (!wabaIds.size && me.granular_scopes) {
    for (const scope of me.granular_scopes as { scope: string; target_ids?: string[] }[]) {
      if (scope.scope === "whatsapp_business_management") {
        for (const id of scope.target_ids ?? []) wabaIds.add(id);
      }
    }
  }

  // Method 2: businesses — works for regular User tokens
  if (!wabaIds.size) {
    const bizRes = await fetch(`${META_API}/${me.id}/businesses?fields=id`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const biz = await bizRes.json();
    for (const b of biz.data ?? []) {
      const [owned, client] = await Promise.all([
        fetch(`${META_API}/${b.id}/owned_whatsapp_business_accounts?fields=id`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch(`${META_API}/${b.id}/client_whatsapp_business_accounts?fields=id`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
      ]);
      for (const w of [...(owned.data ?? []), ...(client.data ?? [])]) wabaIds.add(w.id);
    }
  }

  if (!wabaIds.size) return { phones: [], wabaIds: [] };

  // Get phone numbers for each WABA
  const phones: { id: string; displayPhoneNumber: string; verifiedName: string; wabaId: string }[] = [];
  const seen = new Set<string>();

  await Promise.all(
    [...wabaIds].map(async (wabaId) => {
      const r = await fetch(
        `${META_API}/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = await r.json();
      for (const p of d.data ?? []) {
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
    })
  );

  return { phones, wabaIds: [...wabaIds] };
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  await params;
  if (!session || role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { token, wabaId } = await req.json();
  if (!token?.trim()) return NextResponse.json({ error: "Token requerido" }, { status: 400 });

  try {
    const result = await fetchPhoneNumbers(token.trim(), wabaId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al conectar con Meta" }, { status: 400 });
  }
}
