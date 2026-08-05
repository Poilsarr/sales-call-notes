"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Search, FileText, RefreshCw } from "lucide-react";

type SearchResult = {
  id: string;
  filename: string;
  title: string | null;
  summary: string | null;
  date: string;
  similarity: number;
};

type SearchState =
  | { kind: "idle" }
  | { kind: "loading"; query: string }
  | { kind: "success"; results: SearchResult[]; query: string }
  | { kind: "error"; message: string; query: string; pending: boolean };

export default function CallSearch() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const requestId = useRef(0);

  const runSearch = async (rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) return;
    const thisRequest = ++requestId.current;
    // Retry keeps the error card visible with the retry button in a pending
    // state — no dead states, no context flips mid-flight.
    setState((current) =>
      current.kind === "error" && current.query === q
        ? { ...current, pending: true }
        : { kind: "loading", query: q }
    );
    try {
      const res = await fetch("/api/calls/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const payload = await res.json();
      // Stale-response guard: a slower earlier request must not overwrite
      // the newest one.
      if (thisRequest !== requestId.current) return;
      if (!res.ok) {
        setState({ kind: "error", message: payload?.error || "Search unavailable.", query: q, pending: false });
        return;
      }
      setState({ kind: "success", results: payload.results ?? [], query: q });
    } catch {
      if (thisRequest !== requestId.current) return;
      setState({ kind: "error", message: "Couldn't search your calls. Please try again.", query: q, pending: false });
    }
  };

  const busy = state.kind === "loading" || (state.kind === "error" && state.pending);

  return (
    <div>
      <form
        aria-label="Find calls by topic"
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch(query);
        }}
        className="flex gap-2"
      >
        <label htmlFor="call-search-input" className="sr-only">
          Search your calls
        </label>
        <input
          id="call-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g. "What did Acme say about budget?"'
          autoComplete="off"
          className="flex-1 px-4 py-2.5 rounded-xl bg-linear-black border border-linear-secondary text-sm text-white placeholder-white/50 focus:outline-none focus-visible:outline-2 focus-visible:outline-linear-indigo focus:border-linear-indigo/50"
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className="px-4 py-2.5 bg-linear-indigo rounded-xl text-xs font-semibold hover:bg-linear-indigo/80 transition disabled:opacity-50 inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-linear-indigo"
        >
          {busy ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {busy ? "Searching…" : "Search"}
        </button>
      </form>

      <div className="mt-3">
        <div role="status" aria-live="polite" aria-busy={busy}>
          {busy && <span className="sr-only">Searching your calls…</span>}
          {state.kind === "success" && state.results.length === 0 && (
            <p className="p-4 rounded-xl bg-linear-black border border-linear-secondary border-dashed text-center text-sm text-white/60">
              No calls matched “{state.query}”. Try a phrase like “objections”, “budget”, or “next steps”.
            </p>
          )}
          {state.kind === "success" && state.results.length > 0 && (
            <p className="text-xs text-white/60 mb-2">
              {state.results.length} {state.results.length === 1 ? "call" : "calls"} found
            </p>
          )}
          {state.kind === "error" && (
            <div className="p-4 rounded-xl bg-linear-black border border-red-500/20">
              <p className="text-sm text-red-400/80 mb-3">{state.message}</p>
              <button
                type="button"
                onClick={() => void runSearch(state.query)}
                disabled={busy}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 hover:bg-red-500/20 transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-linear-indigo"
              >
                {state.pending ? (
                  <span className="w-3 h-3 rounded-full border-2 border-red-400/70 border-t-transparent animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                {state.pending ? "Retrying…" : "Retry"}
              </button>
            </div>
          )}
        </div>

        {state.kind === "success" && state.results.length > 0 && (
          <section aria-label="Search results" className="space-y-2">
            {state.results.map((call) => (
              <Link
                key={call.id}
                href={`/app/calls/${call.id}`}
                className="flex items-start gap-3 p-3 rounded-xl bg-linear-black border border-linear-secondary hover:border-linear-indigo/40 hover:bg-white/[0.03] transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-linear-indigo/10 flex items-center justify-center text-linear-indigo shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-white truncate group-hover:text-[#7b86de] transition">
                      {call.title ?? call.filename}
                    </p>
                    <span aria-hidden="true" className="text-[11px] text-[#7b86de] shrink-0">
                      {Math.round(call.similarity * 100)}% match
                    </span>
                  </div>
                  {call.summary && (
                    <p className="text-xs text-white/50 line-clamp-2 mt-1">{call.summary}</p>
                  )}
                  <p className="text-[11px] text-white/50 mt-1">
                    {new Date(call.date).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
