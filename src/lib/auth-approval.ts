import type { UserStatus } from "@db/schema";

/**
 * The approval gate, extracted as pure functions so the rule can be unit-tested
 * without a database or Better Auth (see BLOG_V2_PLAN.md §8). The session-create
 * hook in src/lib/auth.ts consumes these.
 *
 * Rule: only `approved` users may sign in. `pending` and `rejected` (and any
 * unexpected/missing value) are blocked.
 */
export function requiresApproval(status: string | null | undefined): boolean {
  return status !== "approved";
}

export function approvalErrorMessage(
  status: string | null | undefined,
): string {
  return status === "rejected"
    ? "Account was not approved"
    : "Account pending admin approval";
}

export const USER_STATUSES: readonly UserStatus[] = [
  "pending",
  "approved",
  "rejected",
];
