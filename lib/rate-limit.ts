/**
 * In-memory rate limiter. Sufficient for single-instance / dev.
 * For multi-instance production (Vercel serverless), replace with
 * an Upstash Redis-backed solution (e.g. @upstash/ratelimit).
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Prune stale entries every 5 minutes to avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store) {
    if (now > win.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Returns true if the request is allowed, false if it should be blocked.
 * @param key      Unique key (e.g. "pre-login:1.2.3.4")
 * @param limit    Max requests per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const win = store.get(key);

  if (!win || now > win.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (win.count >= limit) return false;

  win.count++;
  return true;
}

/** Extract the real client IP from Next.js request headers. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
