import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminUsers, { type AdminUser } from "@components/admin/AdminUsers";

const pendingUser: AdminUser = {
  id: "u1",
  name: "Ann",
  email: "ann@example.com",
  role: null,
  status: "pending",
  introduction: "I'm Ann, Luca's cousin — we met at the wedding!",
  createdAt: "2026-06-01T00:00:00.000Z",
};

function mockFetchOk(body: unknown) {
  const fn = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response),
  );
  globalThis.fetch = fn as typeof fetch;
  return fn;
}

function mockFetchFail() {
  const fn = vi.fn(() =>
    Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response),
  );
  globalThis.fetch = fn as typeof fetch;
  return fn;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminUsers", () => {
  it("renders the user with name, email and status badge", () => {
    mockFetchOk({});
    render(<AdminUsers initialUsers={[pendingUser]} />);
    expect(screen.getByText("Ann")).toBeInTheDocument();
    expect(screen.getByText("ann@example.com")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("shows the sign-up introduction when present", () => {
    mockFetchOk({});
    render(<AdminUsers initialUsers={[pendingUser]} />);
    expect(
      screen.getByText("I'm Ann, Luca's cousin — we met at the wedding!"),
    ).toBeInTheDocument();
  });

  it("renders without an introduction (Google sign-up)", () => {
    mockFetchOk({});
    render(
      <AdminUsers initialUsers={[{ ...pendingUser, introduction: null }]} />,
    );
    expect(screen.getByText("Ann")).toBeInTheDocument();
  });

  it("PATCHes and reflects the approved status on Approve", async () => {
    const fetchMock = mockFetchOk({
      user: { ...pendingUser, status: "approved" },
    });
    render(<AdminUsers initialUsers={[pendingUser]} />);

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(screen.getByText("Approved")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/users/u1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "approved" }),
      }),
    );
    // Approve is now disabled, Reject still available.
    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /reject/i })).toBeEnabled();
  });

  it("rolls back and shows an error when the PATCH fails", async () => {
    mockFetchFail();
    render(<AdminUsers initialUsers={[pendingUser]} />);

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/couldn't update/i),
    );
    // Status rolled back to Pending.
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("shows an empty state with no users", () => {
    mockFetchOk({});
    render(<AdminUsers initialUsers={[]} />);
    expect(screen.getByText(/no users yet/i)).toBeInTheDocument();
  });
});
