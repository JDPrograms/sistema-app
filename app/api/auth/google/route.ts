import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const role = url.searchParams.get("role") || "user"; // "user" | "admin"
  if (!slug) return NextResponse.json({ error: "slug requerido" }, { status: 400 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Google no configurado" }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const state = Buffer.from(JSON.stringify({ slug, role, nonce: randomBytes(8).toString("hex") })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
