import { useState } from "react";
import {
  type AdminUpdatableStatus,
  type UserStatus,
} from "@lib/admin";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  status: UserStatus;
  introduction: string | null;
  createdAt: string;
};

type Props = {
  initialUsers: AdminUser[];
};

const STATUS_LABEL: Record<UserStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<UserStatus, string> = {
  pending:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  approved:
    "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
  rejected: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export default function AdminUsers({ initialUsers }: Props) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteUser(u: AdminUser) {
    const sure = window.confirm(
      `Delete ${u.name} (${u.email})? Their comments will be deleted too. This can't be undone.`,
    );
    if (!sure) return;

    setBusyId(u.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch {
      setError("Couldn't delete that user. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateStatus(id: string, status: AdminUpdatableStatus) {
    setBusyId(id);
    setError(null);
    const previous = users;
    // Optimistic update.
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status } : u)),
    );
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("update failed");
      const data: { user: AdminUser } = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
    } catch {
      setUsers(previous); // roll back
      setError("Couldn't update that user. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (users.length === 0) {
    return <p className="text-sm opacity-60">No users yet.</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {users.map((u) => {
          const busy = busyId === u.id;
          return (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/40 p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {u.name}
                  </span>
                  {u.role === "admin" && (
                    <span className="rounded border border-border px-1.5 py-0.5 text-xs">
                      admin
                    </span>
                  )}
                  <span
                    className={`rounded border px-1.5 py-0.5 text-xs ${STATUS_CLASS[u.status]}`}
                  >
                    {STATUS_LABEL[u.status]}
                  </span>
                </div>
                <p className="truncate text-sm opacity-60">
                  {u.email}
                </p>
                {u.introduction && (
                  <p className="mt-2 border-l-2 border-accent/40 pl-3 text-sm italic opacity-80">
                    {u.introduction}
                  </p>
                )}
              </div>

              {u.role !== "admin" && (
                <div className="flex gap-2">
                  {u.status === "approved" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => deleteUser(u)}
                      aria-label={`Delete ${u.name}`}
                      title="Delete user"
                      className="rounded-lg border border-rose-600/40 p-2 text-rose-700 transition-colors hover:bg-rose-500/10 disabled:opacity-40 dark:text-rose-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" x2="10" y1="11" y2="17" />
                        <line x1="14" x2="14" y1="11" y2="17" />
                      </svg>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateStatus(u.id, "approved")}
                        className="rounded-lg border border-green-600/40 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-500/10 disabled:opacity-40 dark:text-green-300"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy || u.status === "rejected"}
                        onClick={() => updateStatus(u.id, "rejected")}
                        className="rounded-lg border border-rose-600/40 px-3 py-1.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/10 disabled:opacity-40 dark:text-rose-300"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
