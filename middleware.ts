import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SKIP_PREFIXES = ["/api/", "/_next/", "/favicon.ico", "/.well-known/", "/site/", "/admin", "/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const host = req.headers.get("host") ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const mainHost = appUrl.replace(/https?:\/\//, "").replace(/\/$/, "");

  // Only process custom domains (not main domain, not *.vercel.app, not localhost)
  if (
    !host ||
    host === mainHost ||
    host.endsWith(".vercel.app") ||
    host.startsWith("localhost") ||
    host.startsWith("127.")
  ) {
    return NextResponse.next();
  }

  try {
    const lookupUrl = `${appUrl}/api/internal/domain-slug?domain=${encodeURIComponent(host)}`;
    const res = await fetch(lookupUrl, { next: { revalidate: 60 } });
    if (res.ok) {
      const { slug } = await res.json();
      if (slug) {
        const url = req.nextUrl.clone();
        url.pathname = pathname === "/" ? `/site/${slug}` : `/site/${slug}${pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  } catch {
    // lookup failed — fall through
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
