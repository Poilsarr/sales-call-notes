"use client";

import { useEffect, useState } from "react";
import { Key, Plus, Trash2, Copy, Loader2, AlertTriangle, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * API keys settings UI.
 *
 * Flow:
 *   1. List active keys via GET /api/v1/keys
 *   2. Create via POST → modal shows the raw key + copy button + "shown only once" warning
 *   3. Revoke via DELETE /api/v1/keys/[id]
 *
 * Scope selector: "read" (default) | "read_write"
 */

type KeyRow = {
  id: string;
  name: string;
  prefix: string;
  scope: "read" | "read_write";
  lastUsedAt: string | null;
  createdAt: string;
};

type CreatedKey = KeyRow & { raw: string };

export default function APIKeysSettings() {
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScope, setNewScope] = useState<"read" | "read_write">("read");
  const [justCreated, setJustCreated] = useState<CreatedKey | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/v1/keys");
      if (!r.ok) throw new Error("Failed to load");
      const data = await r.json();
      setKeys(data.keys ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load API keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Name required");
      return;
    }
    setCreating(true);
    try {
      const r = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), scope: newScope }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err?.error || "Failed to create key");
        return;
      }
      const created: CreatedKey = await r.json();
      setJustCreated(created);
      setNewName("");
      setNewScope("read");
      setShowRaw(false);
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string, name: string) {
    if (!confirm(`Revoke "${name}"? Any service using this key will lose access immediately.`)) {
      return;
    }
    setRevokingId(id);
    try {
      const r = await fetch(`/api/v1/keys/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err?.error || "Failed to revoke");
        return;
      }
      toast.success("Key revoked");
      await refresh();
    } finally {
      setRevokingId(null);
    }
  }

  async function copy(raw: string) {
    try {
      await navigator.clipboard.writeText(raw);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed — select the text manually");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-2 text-white/50">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading API keys…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card>
        <form onSubmit={create}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-linear-indigo" />
              <div>
                <CardTitle>Create a new key</CardTitle>
                <CardDescription>You will see the full key once. We store only a hash.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="md:col-span-2 space-y-2">
                <span className="text-sm text-white/60">Name</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={64}
                  placeholder="e.g. Zapier integration"
                  className="w-full px-3 py-2 rounded-xl bg-linear-black border border-linear-secondary text-white text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/60">Scope</span>
                <select
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value as "read" | "read_write")}
                  className="w-full px-3 py-2 rounded-xl bg-linear-black border border-linear-secondary text-white text-sm"
                >
                  <option value="read">Read only</option>
                  <option value="read_write">Read + Write</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2.5 rounded-full bg-linear-indigo text-white text-sm font-medium flex items-center gap-2 disabled:opacity-40 hover:bg-linear-indigo/80 transition"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Generate key
            </button>
          </CardContent>
        </form>
      </Card>

      {/* Just-created reveal */}
      {justCreated && (
        <Card variant="accent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#F26522]" />
              <div>
                <CardTitle>Copy &quot;{justCreated.name}&quot; now</CardTitle>
                <CardDescription>This is the only time you will see the full key.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-stretch gap-2">
              <code className="flex-1 px-3 py-2.5 rounded-xl bg-linear-black border border-linear-secondary text-[#F26522] text-xs font-mono break-all select-all">
                {showRaw ? justCreated.raw : justCreated.raw.slice(0, 12) + "•".repeat(justCreated.raw.length - 12)}
              </code>
              <button
                type="button"
                onClick={() => setShowRaw((s) => !s)}
                className="px-3 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
              >
                {showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => copy(justCreated.raw)}
                className="px-3 py-2 rounded-xl bg-linear-indigo text-white text-sm flex items-center gap-2 shrink-0 hover:bg-linear-indigo/80 transition"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
              <button
                type="button"
                onClick={() => setJustCreated(null)}
                className="px-3 py-2 rounded-xl bg-white/5 text-white/70 text-sm shrink-0 hover:bg-white/10 transition"
              >
                Done
              </button>
            </div>
            <p className="text-xs text-white/40">
              Prefix <code className="font-mono">{justCreated.prefix}</code> · Scope {justCreated.scope}.
              If you lose this, you&apos;ll need to revoke and create a new one.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Existing keys list */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-linear-indigo" />
            <CardTitle>Active keys</CardTitle>
          </div>
          <span className="text-xs text-white/40">{keys.length} active</span>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-sm text-white/40">No API keys yet. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-linear-black border border-linear-secondary"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{k.name}</span>
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          k.scope === "read_write"
                            ? "bg-[#F26522]/10 text-[#F26522] border-[#F26522]/20"
                            : "bg-white/5 text-white/50 border-white/10"
                        }`}
                      >
                        {k.scope === "read_write" ? "R/W" : "Read"}
                      </span>
                    </div>
                    <div className="text-xs text-white/40 font-mono mt-1">
                      {k.prefix}…
                      {" · last used "}
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "never"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => revoke(k.id, k.name)}
                    disabled={revokingId === k.id}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-40 transition"
                    aria-label={`Revoke ${k.name}`}
                  >
                    {revokingId === k.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
          <details className="mt-4 text-xs text-white/40">
            <summary className="cursor-pointer hover:text-white/60">How to use</summary>
            <pre className="mt-2 p-3 rounded-xl bg-linear-black border border-linear-secondary text-white/70 font-mono overflow-x-auto">
{`curl -H "Authorization: Bearer ${keys[0]?.prefix ?? "cn_live_..."}YOUR_SECRET" \\
     https://callnotepro.com/api/v1/calls`}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
