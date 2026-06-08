import { describe, it, expect } from "vitest";
import {
  approvalErrorMessage,
  requiresApproval,
  USER_STATUSES,
} from "@lib/auth-approval";

describe("requiresApproval", () => {
  it("allows approved users to sign in", () => {
    expect(requiresApproval("approved")).toBe(false);
  });

  it("blocks pending users", () => {
    expect(requiresApproval("pending")).toBe(true);
  });

  it("blocks rejected users", () => {
    expect(requiresApproval("rejected")).toBe(true);
  });

  it("blocks missing/unknown statuses (fail closed)", () => {
    expect(requiresApproval(null)).toBe(true);
    expect(requiresApproval(undefined)).toBe(true);
    expect(requiresApproval("")).toBe(true);
    expect(requiresApproval("something-else")).toBe(true);
  });
});

describe("approvalErrorMessage", () => {
  it("gives a rejection-specific message for rejected accounts", () => {
    expect(approvalErrorMessage("rejected")).toBe("Account was not approved");
  });

  it("gives a pending message for pending/unknown accounts", () => {
    expect(approvalErrorMessage("pending")).toBe(
      "Account pending admin approval",
    );
    expect(approvalErrorMessage(null)).toBe("Account pending admin approval");
    expect(approvalErrorMessage(undefined)).toBe(
      "Account pending admin approval",
    );
  });
});

describe("USER_STATUSES", () => {
  it("lists the three known statuses", () => {
    expect(USER_STATUSES).toEqual(["pending", "approved", "rejected"]);
  });

  it("only 'approved' is allowed past the gate", () => {
    const allowed = USER_STATUSES.filter((s) => !requiresApproval(s));
    expect(allowed).toEqual(["approved"]);
  });
});
