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
  rejected: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
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
    return <p className="text-sm text-black/60 dark:text-white/60">No users yet.</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {users.map((u) => {
          const busy = busyId === u.id;
          return (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-black dark:text-white">
                    {u.name}
                  </span>
                  {u.role === "admin" && (
                    <span className="rounded border border-black/20 px-1.5 py-0.5 text-xs dark:border-white/20">
                      admin
                    </span>
                  )}
                  <span
                    className={`rounded border px-1.5 py-0.5 text-xs ${STATUS_CLASS[u.status]}`}
                  >
                    {STATUS_LABEL[u.status]}
                  </span>
                </div>
                <p className="truncate text-sm text-black/60 dark:text-white/60">
                  {u.email}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || u.status === "approved"}
                  onClick={() => updateStatus(u.id, "approved")}
                  className="rounded-lg border border-green-600/40 px-3 py-1.5 text-sm font-medium text-green-700 disabled:opacity-40 dark:text-green-300"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy || u.status === "rejected"}
                  onClick={() => updateStatus(u.id, "rejected")}
                  className="rounded-lg border border-red-600/40 px-3 py-1.5 text-sm font-medium text-red-700 disabled:opacity-40 dark:text-red-300"
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
