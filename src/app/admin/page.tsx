"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/nav";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  createdAt: string;
  _count: { calls: number };
};

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users?q=${encodeURIComponent(search)}&take=50`, {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setUsers([]);
        setTotal(0);
        setError(response.status === 403 ? "Your account is not on the admin allowlist." : data?.error ?? "Could not load users.");
        return;
      }

      setUsers(data?.users ?? []);
      setTotal(data?.total ?? 0);
    } catch {
      setError("Could not load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(query), 250);
    return () => window.clearTimeout(timer);
  }, [loadUsers, query]);

  return (
    <div className="min-h-screen bg-linear-black text-white">
      <Nav />
      <main id="main" className="mx-auto max-w-7xl px-5 pb-16 pt-32 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-linear-indigo">Operations</p>
            <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
            <p className="mt-2 text-sm text-white/50">{total.toLocaleString()} users in the Gauge database</p>
          </div>
          <Link href="/app" className="rounded-full border border-linear-secondary px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white">
            Back to app
          </Link>
        </div>

        <div className="mb-5">
          <label htmlFor="admin-user-search" className="sr-only">Search users</label>
          <input
            id="admin-user-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            className="w-full max-w-md rounded-xl border border-linear-secondary bg-linear-surface px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-linear-indigo/60"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-200">{error}</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-linear-secondary bg-linear-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-linear-secondary text-xs uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-5 py-4 font-medium">User</th>
                    <th className="px-5 py-4 font-medium">Plan</th>
                    <th className="px-5 py-4 font-medium">Calls</th>
                    <th className="px-5 py-4 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-white/40">Loading users…</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-white/40">No users found.</td></tr>
                  ) : users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.03]">
                      <td className="px-5 py-4">
                        <div className="font-medium text-white">{user.name || user.email.split("@")[0]}</div>
                        <div className="mt-1 text-xs text-white/45">{user.email}</div>
                      </td>
                      <td className="px-5 py-4 text-white/70">{user.plan}</td>
                      <td className="px-5 py-4 text-white/70">{user._count.calls}</td>
                      <td className="px-5 py-4 text-white/50">{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
