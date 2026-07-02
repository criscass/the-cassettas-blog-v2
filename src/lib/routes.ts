// Route prefixes that require an authenticated admin.
// /api/keystatic/** is included: with `storage: { kind: 'local' }` Keystatic's
// API handler performs no auth of its own, so the middleware is its only guard.
export const ADMIN_PREFIXES = ["/admin", "/keystatic", "/api/keystatic"];

export function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Our own state-changing API routes get a same-origin check in the middleware
// (CSRF defense-in-depth). /api/auth/** is excluded — Better Auth runs its own
// origin check there.
export const ORIGIN_CHECKED_PREFIXES = [
  "/api/comments",
  "/api/admin",
  "/api/contact",
];

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function requiresSameOrigin(pathname: string, method: string): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return false;
  return ORIGIN_CHECKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * True when the request's Origin header matches the host the request was
 * addressed to. Browsers always send Origin on cross-origin state-changing
 * requests and it can't be forged from a page, so equality with the request
 * host (itself validated against security.allowedDomains in astro.config.mjs)
 * rejects cross-site requests without an allowlist to keep in sync. A missing
 * Origin also fails: every legitimate caller is a browser fetch, which sends it.
 */
export function isSameOrigin(
  originHeader: string | null,
  requestUrl: URL,
): boolean {
  if (!originHeader) return false;
  try {
    return new URL(originHeader).host === requestUrl.host;
  } catch {
    return false;
  }
}
