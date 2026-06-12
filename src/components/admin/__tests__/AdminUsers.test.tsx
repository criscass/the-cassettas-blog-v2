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

const approvedUser: AdminUser = {
  ...pendingUser,
  id: "u2",
  name: "Bea",
  email: "bea@example.com",
  status: "approved",
};

const adminUser: AdminUser = {
  ...pendingUser,
  id: "u3",
  name: "Cri",
  email: "cri@example.com",
  role: "admin",
  status: "approved",
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
    // Approve/Reject are replaced by the delete button once approved.
    expect(
      screen.queryByRole("button", { name: /approve/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reject/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete ann/i }),
    ).toBeInTheDocument();
  });

  it("shows no action buttons for an admin", () => {
    mockFetchOk({});
    render(<AdminUsers initialUsers={[adminUser]} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows only the delete button for an approved user", () => {
    mockFetchOk({});
    render(<AdminUsers initialUsers={[approvedUser]} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName(/delete bea/i);
  });

  it("does not DELETE when the confirmation is dismissed", () => {
    const fetchMock = mockFetchOk({ ok: true });
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<AdminUsers initialUsers={[approvedUser]} />);

    fireEvent.click(screen.getByRole("button", { name: /delete bea/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Bea")).toBeInTheDocument();
  });

  it("DELETEs and removes the user after confirmation", async () => {
    const fetchMock = mockFetchOk({ ok: true });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminUsers initialUsers={[approvedUser]} />);

    fireEvent.click(screen.getByRole("button", { name: /delete bea/i }));

    await waitFor(() =>
      expect(screen.queryByText("Bea")).not.toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/users/u2",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("keeps the user and shows an error when the DELETE fails", async () => {
    mockFetchFail();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminUsers initialUsers={[approvedUser]} />);

    fireEvent.click(screen.getByRole("button", { name: /delete bea/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/couldn't delete/i),
    );
    expect(screen.getByText("Bea")).toBeInTheDocument();
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
