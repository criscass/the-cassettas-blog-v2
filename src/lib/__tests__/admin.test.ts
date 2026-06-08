import { describe, it, expect } from "vitest";
import {
  isAdmin,
  isAdminUpdatableStatus,
  parseStatusUpdate,
} from "@lib/admin";

describe("isAdmin", () => {
  it("is true only for role 'admin'", () => {
    expect(isAdmin({ role: "admin" })).toBe(true);
  });

  it("is false for non-admins, missing role, and anonymous", () => {
    expect(isAdmin({ role: "user" })).toBe(false);
    expect(isAdmin({ role: null })).toBe(false);
    expect(isAdmin({})).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe("isAdminUpdatableStatus", () => {
  it("accepts approved and rejected", () => {
    expect(isAdminUpdatableStatus("approved")).toBe(true);
    expect(isAdminUpdatableStatus("rejected")).toBe(true);
  });

  it("rejects 'pending' and anything else (no manual move to pending)", () => {
    expect(isAdminUpdatableStatus("pending")).toBe(false);
    expect(isAdminUpdatableStatus("banned")).toBe(false);
    expect(isAdminUpdatableStatus(null)).toBe(false);
    expect(isAdminUpdatableStatus(undefined)).toBe(false);
  });
});

describe("parseStatusUpdate", () => {
  it("accepts a valid status transition", () => {
    expect(parseStatusUpdate({ status: "approved" })).toEqual({
      ok: true,
      status: "approved",
    });
    expect(parseStatusUpdate({ status: "rejected" })).toEqual({
      ok: true,
      status: "rejected",
    });
  });

  it("rejects a non-object body", () => {
    expect(parseStatusUpdate(null).ok).toBe(false);
    expect(parseStatusUpdate("approved").ok).toBe(false);
    expect(parseStatusUpdate(undefined).ok).toBe(false);
  });

  it("rejects an invalid or missing status", () => {
    expect(parseStatusUpdate({}).ok).toBe(false);
    expect(parseStatusUpdate({ status: "pending" }).ok).toBe(false);
    expect(parseStatusUpdate({ status: 42 }).ok).toBe(false);
  });
});
