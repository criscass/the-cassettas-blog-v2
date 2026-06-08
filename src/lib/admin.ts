import type { UserStatus } from "@db/schema";

/**
 * Pure admin rules — the role check and the status-update validation — kept
 * separate from the endpoint so they're unit-testable without a DB or request
 * context (mirrors src/lib/auth-approval.ts and src/lib/comments.ts).
 */

export function isAdmin(
  user: { role?: string | null } | null | undefined,
): boolean {
  return user?.role === "admin";
}

// An admin may only move a user to one of these via the approval queue.
// (`pending` is the sign-up default and isn't a manual target here.)
export const ADMIN_UPDATABLE_STATUSES = ["approved", "rejected"] as const;
export type AdminUpdatableStatus = (typeof ADMIN_UPDATABLE_STATUSES)[number];

export function isAdminUpdatableStatus(
  value: unknown,
): value is AdminUpdatableStatus {
  return value === "approved" || value === "rejected";
}

export type StatusUpdateResult =
  | { ok: true; status: AdminUpdatableStatus }
  | { ok: false; error: string };

/** Validate a PATCH body of the shape `{ status: 'approved' | 'rejected' }`. */
export function parseStatusUpdate(body: unknown): StatusUpdateResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body" };
  }
  const status = (body as { status?: unknown }).status;
  if (!isAdminUpdatableStatus(status)) {
    return {
      ok: false,
      error: `status must be one of: ${ADMIN_UPDATABLE_STATUSES.join(", ")}`,
    };
  }
  return { ok: true, status };
}

// Re-exported for callers that want the full status union (e.g. UI filters).
export type { UserStatus };
