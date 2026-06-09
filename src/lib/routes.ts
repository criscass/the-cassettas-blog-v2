// Page-route prefixes that require an authenticated admin.
// /api/keystatic/** is intentionally excluded — Keystatic guards those itself.
export const ADMIN_PREFIXES = ["/admin", "/keystatic"];

export function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
