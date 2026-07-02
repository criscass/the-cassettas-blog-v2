/**
 * Lightweight in-memory sliding-window rate limiter, shared by the contact
 * form (keyed by client IP) and comment posting (keyed by user id).
 *
 * Caveat: serverless instances don't share memory and recycle, so this only
 * throttles bursts on a single warm instance — adequate for a small blog, not
 * a hard guarantee. Don't rely on it as the sole abuse control.
 */
export function createRateLimiter(
  max: number,
  windowMs: number,
): (key: string) => boolean {
  const hits = new Map<string, number[]>();

  return function isRateLimited(key: string): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    return recent.length > max;
  };
}
