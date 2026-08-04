'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Search, Filter, Phone, Download, Upload, Mic, Chrome, ArchiveRestore } from 'lucide-react';
import UpgradePrompt from '@/components/upgrade-prompt';
import { toast } from 'sonner';
import { sanitizeCsvCell } from '@/lib/call-title';
import { CallTitleEditor } from '@/components/call-title-editor';

interface CallEntry {
  id: string;
  filename: string;
  createdAt: string;
  healthScore: number | null;
  sentiment: string | null;
  summary: string | null;
  actionItems: Array<{ task: string; owner: string; due: string | null }>;
  sharedWithTeam?: boolean;
  ownerName?: string | null;
  assigneeName?: string | null;
  title?: string | null;
  displayName?: string;
}

interface ArchivedEntry {
  id: string;
  filename: string;
  createdAt: string;
  title?: string | null;
  displayName?: string;
}

type Tab = "active" | "archived";

export default function CallsPage() {
  const { user } = useUser();
  const [calls, setCalls] = useState<CallEntry[]>([]);
  const [archived, setArchived] = useState<ArchivedEntry[]>([]);
  const [tab, setTab] = useState<Tab>("active");
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [retention, setRetention] = useState<{ plan: string; callLimit: number | string; visibleCount: number }>({
    plan: "free",
    callLimit: 5,
    visibleCount: 0,
  });
  const searchRef = useRef<HTMLInputElement>(null);

  const loadArchived = () => {
    if (!user?.id) return;
    fetch(`/api/calls/archived`, { cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : { calls: [] }))
      .then((d) => setArchived(Array.isArray(d.calls) ? d.calls : []))
      .catch(() => setArchived([]));
  };

  const restoreCall = async (id: string) => {
    setRestoringId(id);
    try {
      const res = await fetch(`/api/calls/${id}/restore`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          toast.error(data.error || "You're at your call limit. Upgrade for unlimited.");
        } else {
          toast.error(data.error || "Failed to restore call");
        }
        return;
      }
      toast.success("Call restored");
      setArchived((prev) => prev.filter((c) => c.id !== id));
      // refresh active list so the restored call reappears
      const currentUserId = user?.id;
      if (!currentUserId) return;
      const url = `/api/history?userId=${currentUserId}`;
      fetch(url, { cache: "no-store" })
        .then(async (r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) return;
          setCalls(Array.isArray(d) ? d : (d.calls ?? []));
          if (d.plan) setRetention({ plan: d.plan, callLimit: d.callLimit, visibleCount: d.visibleCount ?? 0 });
        })
        .catch(() => {});
    } catch {
      toast.error("Failed to restore call");
    } finally {
      setRestoringId(null);
    }
  };

  const renameCall = async (call: CallEntry, title: string | null) => {
    try {
      const res = await fetch(`/api/history/${call.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to rename (${res.status})`);
      const displayName = data.displayName ?? title ?? call.filename;
      setCalls((prev) =>
        prev.map((c) => (c.id === call.id ? { ...c, title: data.title ?? null, displayName } : c)),
      );
      setEditingId(null);
      toast.success('Call renamed');
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename call');
      return false;
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    const url = searchQuery.trim()
      ? `/api/history?userId=${user.id}&q=${encodeURIComponent(searchQuery.trim())}`
      : `/api/history?userId=${user.id}`;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(
            (data && (data.error || data.message)) ||
              `Failed to load calls (${r.status})`,
          );
        }
        return data;
      })
      .then((data) => {
        setCalls(Array.isArray(data) ? data : (data.calls ?? []));
        if (data.plan) {
          setRetention({
            plan: data.plan,
            callLimit: data.callLimit,
            visibleCount: data.visibleCount ?? (Array.isArray(data) ? data.length : (data.calls?.length ?? 0)),
          });
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        toast.error(err instanceof Error ? err.message : "Failed to load calls");
        setCalls([]);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [user?.id, searchQuery]);

  useEffect(() => {
    if (tab === "archived") loadArchived();
  }, [tab, user?.id]);

  const isLimited = retention.callLimit !== "unlimited";
  const atLimit = isLimited && retention.visibleCount >= (retention.callLimit as number);

  // Server-side search already filtered; the client-side filter below
  // remains as a defensive narrowing on filename/summary (matches what
  // users would expect from the visible placeholder).
  const query = searchQuery.toLowerCase();
  const matches = (c: CallEntry) =>
    (c.filename || '').toLowerCase().includes(query) ||
    (c.title || '').toLowerCase().includes(query) ||
    (c.summary || '').toLowerCase().includes(query);

  const filteredCalls = calls.filter(call => !searchQuery.trim() || matches(call));

  const exportCSV = () => {
    const headers = 'Filename,Date,Health Score,Sentiment,Action Items,Summary\n';
    const cell = (v: unknown) => `"${sanitizeCsvCell(v)}"`;
    const rows = calls.map(c =>
      [
        cell(c.displayName ?? c.filename),
        cell(new Date(c.createdAt).toLocaleDateString()),
        cell(c.healthScore ?? ''),
        cell(c.sentiment ?? ''),
        cell(c.actionItems.length),
        cell(c.summary ?? ''),
      ].join(',')
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calls-export.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${calls.length} calls to CSV`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Calls</h1>
          <p className="text-zinc-400">Browse and search your call history</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="rounded-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={calls.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <Link href="/app/record" className="btn-island">
            Record Call
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search all calls (filename, transcript, summary)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button onClick={() => searchRef.current?.focus()} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors">
          <Filter className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-zinc-800">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${tab === "active" ? "text-white border-b-2 border-emerald-500" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          Active
        </button>
        <button
          onClick={() => setTab("archived")}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === "archived" ? "text-white border-b-2 border-emerald-500" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          Archived
          {archived.length > 0 && (
            <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-400">{archived.length}</span>
          )}
        </button>
      </div>

      {tab === "archived" ? (
        <div className="space-y-3">
          {restoringId === null && archived.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-zinc-500">No archived calls.</p>
              <p className="text-[12.5px] text-zinc-600 mt-1">
                Calls beyond your plan limit are archived here instead of deleted.
              </p>
            </div>
          ) : (
            archived.map((call) => (
              <div key={call.id} className="doppel-outer-dark">
                <div className="doppel-inner-dark p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{call.displayName ?? call.filename}</p>
                      <p className="text-sm text-zinc-500">
                        {new Date(call.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {" · archived"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => restoreCall(call.id)}
                    disabled={restoringId === call.id}
                    className="rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                    {restoringId === call.id ? "Restoring…" : "Restore"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <UpgradePrompt feature="crm_sync" featureName="CRM Sync" minimal />

      {isLimited && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <p className="text-sm text-zinc-400">
            <span className="text-white font-medium">{retention.visibleCount}</span>
            {retention.callLimit !== "unlimited" && ` / ${retention.callLimit}`} calls kept on your{" "}
            <span className="capitalize text-white/80">{retention.plan}</span> plan.
            {atLimit && " You're at your limit — oldest calls are archived as you add new ones."}
          </p>
          {atLimit && (
            <Link href="/pricing" className="shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
              Upgrade for unlimited
            </Link>
          )}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          // Skeleton loader to prevent CLS when calls appear
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="doppel-outer-dark">
                <div className="doppel-inner-dark p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
                    <div>
                      <div className="h-4 w-32 rounded bg-zinc-800 animate-pulse" />
                      <div className="h-3 w-24 rounded bg-zinc-800/60 animate-pulse mt-2" />
                    </div>
                  </div>
                  <div className="h-6 w-20 rounded-full bg-zinc-800 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCalls.length === 0 ? (
          // Visual empty state — same pattern as the /app dashboard
          // recent-calls empty state. Was a one-liner that made the
          // page feel "unbuilt". Now: header with icon + h-line +
          // body + 3 numbered onboarding steps (Upload, Record, Chrome
          // extension), the most impactful (Upload) styled as the
          // primary action. Distinguishes "no calls yet" (empty data)
          // from "no search results" (defensive).
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6 sm:p-8">
            {calls.length === 0 ? (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-[#F26522]/10 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-[#F26522]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-medium text-white">
                      No calls yet.
                    </p>
                    <p className="text-[12.5px] text-zinc-500 mt-0.5">
                      Every call you upload shows up here, fully transcribed and searchable.
                    </p>
                  </div>
                </div>
                <ol className="space-y-2.5 text-[13px]">
                  <li className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#F26522] text-white text-[11px] font-mono font-semibold flex items-center justify-center">
                      1
                    </span>
                    <Link
                      href="/app/record"
                      className="flex-1 flex items-center justify-between"
                    >
                      <span className="text-white font-medium inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#F26522]" />
                        Upload an MP3 / paste a URL
                      </span>
                      <span className="text-[11px] text-zinc-500">~30s</span>
                    </Link>
                  </li>
                  <li className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-mono font-semibold flex items-center justify-center">
                      2
                    </span>
                    <Link
                      href="/app/record"
                      className="flex-1 flex items-center justify-between"
                    >
                      <span className="text-white font-medium inline-flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-zinc-300" />
                        Record a call in the browser
                      </span>
                      <span className="text-[11px] text-zinc-500">live transcript</span>
                    </Link>
                  </li>
                  <li className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-mono font-semibold flex items-center justify-center">
                      3
                    </span>
                    <Link
                      href="/extension"
                      className="flex-1 flex items-center justify-between"
                    >
                      <span className="text-white font-medium inline-flex items-center gap-1.5">
                        <Chrome className="w-3.5 h-3.5 text-zinc-300" />
                        Capture live from Google Meet
                      </span>
                      <span className="text-[11px] text-zinc-500">auto-save</span>
                    </Link>
                  </li>
                </ol>
              </>
            ) : (
              // Defensive: the server returned calls but the client-side
              // filter excluded all of them. Plain "no results" state.
              <p className="text-zinc-500 text-center py-6">
                No calls match &ldquo;{searchQuery}&rdquo;. Try a shorter search.
              </p>
            )}
          </div>
        ) : (
          filteredCalls.map((call, index) => {
            const displayName = call.displayName ?? call.filename;
            return (
            <div
              key={call.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
            >
              {editingId === call.id ? (
                <div className="doppel-outer-dark hover:ring-emerald-500/30 transition-all cursor-pointer">
                  <div className="doppel-inner-dark p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-zinc-400" />
                      </div>
                      <CallTitleEditor
                        displayName={displayName}
                        onSave={(title) => renameCall(call, title)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
              <Link href={`/app/calls/${call.id}`}>
                <div className="doppel-outer-dark hover:ring-emerald-500/30 transition-all cursor-pointer">
                  <div className="doppel-inner-dark p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-white font-medium truncate">{displayName}</p>
                          <CallTitleEditor
                            displayName={displayName}
                            disabled={editingId !== null && editingId !== call.id}
                            onSave={(title) => renameCall(call, title)}
                          />
                        </div>
                        <p className="text-sm text-zinc-500">
                          {new Date(call.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {call.actionItems.length > 0 && ` · ${call.actionItems.length} action items`}
                          {call.ownerName && ` · Owner: ${call.ownerName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {call.sharedWithTeam && (
                        <span className="px-3 py-1 rounded-full text-sm bg-blue-500/10 text-blue-300">
                          Shared
                        </span>
                      )}
                      {call.assigneeName && (
                        <span className="px-3 py-1 rounded-full text-sm bg-violet-500/10 text-violet-300">
                          {call.assigneeName}
                        </span>
                      )}
                      {call.healthScore != null && (
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          call.healthScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                          call.healthScore >= 60 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {Math.round(call.healthScore)}% Health
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              )}
            </div>
            );
          })
        )}
        </div>
      </>
      )}
    </div>
  );
}
