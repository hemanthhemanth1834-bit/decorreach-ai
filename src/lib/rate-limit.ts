// Simple in-memory rate limiter (per-process). For production use Redis/Upstash.
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000): {
  allowed: boolean;
  remaining: number;
  resetAfterMs: number;
} {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAfterMs: windowMs };
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAfterMs: entry.resetAt - now };
  }
  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAfterMs: entry.resetAt - now };
}

export function clientKeyFromHeaders(h: Headers): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "anonymous";
}
