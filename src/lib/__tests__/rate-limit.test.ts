import { afterEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "@lib/rate-limit";

describe("createRateLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to max hits, then limits", () => {
    const isRateLimited = createRateLimiter(3, 1000);
    expect(isRateLimited("a")).toBe(false);
    expect(isRateLimited("a")).toBe(false);
    expect(isRateLimited("a")).toBe(false);
    expect(isRateLimited("a")).toBe(true);
  });

  it("tracks keys independently", () => {
    const isRateLimited = createRateLimiter(1, 1000);
    expect(isRateLimited("a")).toBe(false);
    expect(isRateLimited("b")).toBe(false);
    expect(isRateLimited("a")).toBe(true);
  });

  it("forgets hits once the window has passed", () => {
    vi.useFakeTimers();
    const isRateLimited = createRateLimiter(1, 1000);
    expect(isRateLimited("a")).toBe(false);
    expect(isRateLimited("a")).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(isRateLimited("a")).toBe(false);
  });

  it("keeps limiters independent of each other", () => {
    const first = createRateLimiter(1, 1000);
    const second = createRateLimiter(1, 1000);
    expect(first("a")).toBe(false);
    expect(second("a")).toBe(false);
  });
});
