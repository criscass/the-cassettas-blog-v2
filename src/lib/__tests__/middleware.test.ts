import { describe, it, expect } from "vitest";
import { isAdminRoute } from "@lib/routes";

describe("isAdminRoute", () => {
  it("gates /admin and its sub-paths", () => {
    expect(isAdminRoute("/admin")).toBe(true);
    expect(isAdminRoute("/admin/")).toBe(true);
    expect(isAdminRoute("/admin/users")).toBe(true);
  });

  it("gates /keystatic and its sub-paths", () => {
    expect(isAdminRoute("/keystatic")).toBe(true);
    expect(isAdminRoute("/keystatic/")).toBe(true);
    expect(isAdminRoute("/keystatic/collection/blogIt")).toBe(true);
  });

  it("does not gate public routes", () => {
    expect(isAdminRoute("/")).toBe(false);
    expect(isAdminRoute("/it/blog")).toBe(false);
    expect(isAdminRoute("/en/blog")).toBe(false);
    expect(isAdminRoute("/api/comments")).toBe(false);
    expect(isAdminRoute("/it/sign-in")).toBe(false);
  });

  it("does not gate /api/keystatic (guarded by Keystatic itself)", () => {
    expect(isAdminRoute("/api/keystatic")).toBe(false);
    expect(isAdminRoute("/api/keystatic/github/created")).toBe(false);
  });
});
