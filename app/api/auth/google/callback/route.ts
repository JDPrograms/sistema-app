import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  let slug = "";
  let role = "user";
  try {
    const decoded = JSON.parse(Buffer.from(state || "", "base64url").toString());
    slug = decoded.slug || "";
    role = decoded.role || "user";
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
    const { id: googleId, email, name } = googleUser;
    if (!email) throw new Error("No email from Google");

    const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
    if (!site) return NextResponse.redirect(new URL(`/site/${slug}/login?error=site`, req.url));

    const googleLoginToken = randomBytes(32).toString("hex");
    const googleLoginExpires = new Date(Date.now() + 5 * 60 * 1000);

    if (role === "admin") {
      // Admin: must already exist — only link Google, never auto-create
      const admin = await prisma.siteAdmin.findUnique({
        where: { email_siteId: { email: email.toLowerCase(), siteId: site.id } },
      });
      if (!admin) {
        // No admin account with that Google email
        return NextResponse.redirect(new URL(`/site/${slug}/login?error=no_admin`, req.url));
      }
      await prisma.siteAdmin.update({
        where: { id: admin.id },
        data: { googleId, googleLoginToken, googleLoginExpires },
      });
      return NextResponse.redirect(new URL(`/site/${slug}/portal/google-complete?t=${googleLoginToken}&role=admin`, req.url));
    }

    // User role: find or create
    let user = await prisma.siteUser.findFirst({
      where: { OR: [{ googleId, siteId: site.id }, { email: email.toLowerCase(), siteId: site.id }] },
    });
    if (!user) {
      user = await prisma.siteUser.create({
        data: {
          email: email.toLowerCase(),
          name: name || email,
          password: randomBytes(32).toString("hex"),
          siteId: site.id,
          emailVerified: true,
          provider: "google",
          googleId,
        },
      });
    } else if (!user.googleId) {
      user = await prisma.siteUser.update({
        where: { id: user.id },
        data: { googleId, emailVerified: true, provider: "google" },
      });
    }
    await prisma.siteUser.update({
      where: { id: user.id },
      data: { googleLoginToken, googleLoginExpires },
    });
    return NextResponse.redirect(new URL(`/site/${slug}/portal/google-complete?t=${googleLoginToken}&role=user`, req.url));
  } catch (e) {
    console.error("Google callback error:", e);
    return NextResponse.redirect(new URL(`/site/${slug}/login?error=google`, req.url));
  }
}
