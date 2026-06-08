import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the auth client so we can drive the signed-in/approved state per test.
const mockUseSession = vi.fn();
vi.mock("@lib/auth-client", () => ({
  useSession: () => mockUseSession(),
}));

import CommentsSection from "@components/CommentsSection";

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetch(impl: (url: string, init?: RequestInit) => unknown) {
  const fn: FetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const body = impl(url, init);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body),
    } as Response);
  });
  globalThis.fetch = fn as typeof fetch;
  return fn;
}

beforeEach(() => {
  mockUseSession.mockReturnValue({ data: null, isPending: false });
  mockFetch(() => ({ comments: [] }));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CommentsSection", () => {
  it("shows a sign-in prompt for anonymous visitors", async () => {
    render(<CommentsSection postId="post-00042" lang="en" />);

    await waitFor(() =>
      expect(screen.getByText(/Sign in to leave a comment/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/en/sign-in",
    );
    expect(screen.queryByPlaceholderText(/write a comment/i)).toBeNull();
  });

  it("shows a pending message for signed-in but unapproved users", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", name: "Ann", status: "pending" } },
      isPending: false,
    });
    render(<CommentsSection postId="post-00042" lang="en" />);

    await waitFor(() =>
      expect(screen.getByText(/awaiting approval/i)).toBeInTheDocument(),
    );
    expect(screen.queryByPlaceholderText(/write a comment/i)).toBeNull();
  });

  it("shows the comment form for approved users", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", name: "Ann", status: "approved" } },
      isPending: false,
    });
    render(<CommentsSection postId="post-00042" lang="en" />);

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText(/write a comment/i),
      ).toBeInTheDocument(),
    );
  });

  it("renders existing comments fetched from the API", async () => {
    mockFetch(() => ({
      comments: [
        {
          id: "c1",
          content: "First!",
          createdAt: "2026-01-01T00:00:00.000Z",
          authorName: "Bea",
        },
      ],
    }));
    render(<CommentsSection postId="post-00042" lang="en" />);

    await waitFor(() =>
      expect(screen.getByText("First!")).toBeInTheDocument(),
    );
    expect(screen.getByText("Bea")).toBeInTheDocument();
  });

  it("optimistically appends a comment after a successful POST", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", name: "Ann", status: "approved" } },
      isPending: false,
    });
    mockFetch((_url, init) => {
      if (init?.method === "POST") {
        return {
          comment: {
            id: "new1",
            content: "Hello world",
            createdAt: "2026-06-08T00:00:00.000Z",
            authorName: "Ann",
          },
        };
      }
      return { comments: [] };
    });

    render(<CommentsSection postId="post-00042" lang="en" />);

    const textarea = await screen.findByPlaceholderText(/write a comment/i);
    fireEvent.change(textarea, { target: { value: "Hello world" } });
    fireEvent.click(screen.getByRole("button", { name: /post/i }));

    await waitFor(() =>
      expect(screen.getByText("Hello world")).toBeInTheDocument(),
    );
    expect(screen.getByText("Ann")).toBeInTheDocument();
  });
});
