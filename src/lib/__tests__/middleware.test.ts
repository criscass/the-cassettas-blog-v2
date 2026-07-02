import { describe, it, expect } from "vitest";
import { isAdminRoute, isSameOrigin, requiresSameOrigin } from "@lib/routes";

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

  it("gates /api/keystatic (local storage means Keystatic has no auth of its own)", () => {
    expect(isAdminRoute("/api/keystatic")).toBe(true);
    expect(isAdminRoute("/api/keystatic/github/created")).toBe(true);
  });
});

describe("requiresSameOrigin", () => {
  it("covers state-changing methods on our API routes", () => {
    expect(requiresSameOrigin("/api/comments", "POST")).toBe(true);
    expect(requiresSameOrigin("/api/admin/users/abc", "PATCH")).toBe(true);
    expect(requiresSameOrigin("/api/admin/users/abc", "DELETE")).toBe(true);
    expect(requiresSameOrigin("/api/contact", "POST")).toBe(true);
  });

  it("skips safe methods", () => {
    expect(requiresSameOrigin("/api/comments", "GET")).toBe(false);
    expect(requiresSameOrigin("/api/comments", "get")).toBe(false);
    expect(requiresSameOrigin("/api/comments", "HEAD")).toBe(false);
    expect(requiresSameOrigin("/api/comments", "OPTIONS")).toBe(false);
  });

  it("leaves Better Auth and page routes alone", () => {
    expect(requiresSameOrigin("/api/auth/sign-in/email", "POST")).toBe(false);
    expect(requiresSameOrigin("/it/sign-in", "POST")).toBe(false);
    expect(requiresSameOrigin("/api/commentsx", "POST")).toBe(false);
  });
});

describe("isSameOrigin", () => {
  const requestUrl = new URL("https://www.cassettas-reboot.xyz/api/comments");

  it("accepts a matching origin", () => {
    expect(isSameOrigin("https://www.cassettas-reboot.xyz", requestUrl)).toBe(true);
  });

  it("rejects a different host", () => {
    expect(isSameOrigin("https://evil.example", requestUrl)).toBe(false);
    expect(isSameOrigin("https://cassettas-reboot.xyz", requestUrl)).toBe(false);
  });

  it("rejects a missing, null, or malformed Origin header", () => {
    expect(isSameOrigin(null, requestUrl)).toBe(false);
    expect(isSameOrigin("null", requestUrl)).toBe(false);
    expect(isSameOrigin("not a url", requestUrl)).toBe(false);
  });

  it("compares host including port (dev server)", () => {
    const dev = new URL("http://localhost:4321/api/comments");
    expect(isSameOrigin("http://localhost:4321", dev)).toBe(true);
    expect(isSameOrigin("http://localhost:9999", dev)).toBe(false);
  });
});
