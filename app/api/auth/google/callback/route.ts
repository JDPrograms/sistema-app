import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  // Parse state
  let slug = "";
  try {
    const decoded = JSON.parse(Buffer.from(state || "", "base64url").toString());
    slug = decoded.slug || "";
  } catch {
    return NextResponse.redirect(new URL("/login?error=google", req.url));
  }

  if (errorParam || !code || !slug) {
    return NextResponse.redirect(new URL(`/site/${slug}/login?error=google`, req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }).toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token");

    // Get Google user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();
    const { id: googleId, email, name, picture } = googleUser;

    if (!email) throw new Error("No email from Google");

    // Find site
    const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
    if (!site) return NextResponse.redirect(new URL(`/site/${slug}/login?error=site`, req.url));

    // Find or create SiteUser
    let user = await prisma.siteUser.findFirst({
      where: { OR: [{ googleId, siteId: site.id }, { email: email.toLowerCase(), siteId: site.id }] },
    });

    if (!user) {
      user = await prisma.siteUser.create({
        data: {
          email: email.toLowerCase(),
          name: name || email,
          password: randomBytes(32).toString("hex"), // unusable random password
          siteId: site.id,
          emailVerified: true,
          provider: "google",
          googleId,
        },
      });
    } else if (!user.googleId) {
      // Link existing email account to Google
      user = await prisma.siteUser.update({
        where: { id: user.id },
        data: { googleId, emailVerified: true, provider: "google" },
      });
    }

    // Generate one-time login token (valid 5 minutes)
    const googleLoginToken = randomBytes(32).toString("hex");
    await prisma.siteUser.update({
      where: { id: user.id },
      data: {
        googleLoginToken,
        googleLoginExpires: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return NextResponse.redirect(new URL(`/site/${slug}/portal/google-complete?t=${googleLoginToken}`, req.url));
  } catch (e) {
    console.error("Google callback error:", e);
    return NextResponse.redirect(new URL(`/site/${slug}/login?error=google`, req.url));
  }
}
