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
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || u.status === "approved"}
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
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
