"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Loader2, ShieldCheck, Trash2 } from "lucide-react";

/**
 * Part 7B — retention settings UI (/settings/retention).
 *
 * No GET/POST policy API exists (only the retention cron + its defaults),
 * so this page is intentionally client-only:
 * - Effective defaults rendered as read-only text (90-day audio,
 *   365-day transcripts).
 * - Policy editing shown as coming-soon with disabled inputs (no backend).
 * - Danger-zone per-meeting purge: input a call ID + DELETE
 *   /api/v1/meetings/:id behind a confirm dialog.
 *
 * Relative fetch only. No secrets. No absolute URLs.
 */

const EFFECTIVE_DEFAULTS = {
  audioDays: 90,
  transcriptDays: 365,
} as const;

export default function RetentionSettingsPage() {
  const [callId, setCallId] = useState("");
  const [purging, setPurging] = useState(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [purgedId, setPurgedId] = useState<string | null>(null);

  async function purge(e: React.FormEvent) {
    e.preventDefault();
    setPurgeError(null);
    setPurgedId(null);
    const id = callId.trim();
    if (!id) {
      setPurgeError("Enter a meeting (call) ID to purge.");
      return;
    }
    if (
      !confirm(
        `Permanently purge meeting "${id}"? Audio, transcript, and analysis are deleted. This cannot be undone.`,
      )
    ) {
      return;
    }
    setPurging(true);
    try {
      const res = await fetch(`/api/v1/meetings/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as {
        deleted?: boolean;
        id?: string;
        error?: string;
      };
      if (!res.ok || !data.deleted) {
        setPurgeError(data.error || "Could not purge meeting.");
        return;
      }
      setPurgedId(data.id ?? id);
      setCallId("");
    } catch (e) {
      setPurgeError(e instanceof Error ? e.message : "Could not purge meeting.");
    } finally {
      setPurging(false);
    }
  }

  return (
    <>
      <Nav />
      <main id="main" className="min-h-screen bg-linear-black text-white">
        <div className="max-w-3xl mx-auto px-6 pt-28 pb-24 space-y-6">
          <div>
            <Link
              href="/settings?tab=security"
              className="text-xs text-white/40 hover:text-white/70 underline-offset-4 hover:underline"
            >
              ← Back to Settings · Security
            </Link>
            <h1 className="text-2xl font-medium tracking-tight mt-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-linear-indigo" />
              Retention
            </h1>
            <p className="text-sm text-white/50 mt-1">
              How long we keep meeting data, and per-meeting purge controls.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-linear-indigo" />
                <div>
                  <CardTitle>Effective defaults</CardTitle>
                  <CardDescription>
                    Enforced by the retention cron. Read-only — no policy API exists yet.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-linear-black border border-linear-secondary p-3">
                  <dt className="text-white/50 text-xs">Audio recordings</dt>
                  <dd className="text-white font-medium mt-1">
                    Kept {EFFECTIVE_DEFAULTS.audioDays} days
                  </dd>
                </div>
                <div className="rounded-xl bg-linear-black border border-linear-secondary p-3">
                  <dt className="text-white/50 text-xs">Transcripts &amp; analysis</dt>
                  <dd className="text-white font-medium mt-1">
                    Kept {EFFECTIVE_DEFAULTS.transcriptDays} days
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle>Policy editing</CardTitle>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border bg-white/5 text-white/50 border-white/10">
                  Coming soon
                </span>
              </div>
              <CardDescription>
                Custom retention windows are not editable yet — no policy backend exists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <fieldset disabled aria-describedby="retention-coming-soon" className="opacity-60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="space-y-2 block">
                    <span className="text-sm text-white/60">Audio retention (days)</span>
                    <input
                      type="number"
                      defaultValue={EFFECTIVE_DEFAULTS.audioDays}
                      className="w-full px-3 py-2 rounded-xl bg-linear-black border border-linear-secondary text-white text-sm"
                    />
                  </label>
                  <label className="space-y-2 block">
                    <span className="text-sm text-white/60">Transcript retention (days)</span>
                    <input
                      type="number"
                      defaultValue={EFFECTIVE_DEFAULTS.transcriptDays}
                      className="w-full px-3 py-2 rounded-xl bg-linear-black border border-linear-secondary text-white text-sm"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="mt-4 px-4 py-2.5 rounded-full bg-white/5 text-white/50 text-sm font-medium cursor-not-allowed"
                >
                  Save policy
                </button>
              </fieldset>
              <p id="retention-coming-soon" className="text-xs text-white/40 mt-3">
                Policy editing is coming soon. Until then the cron enforces the defaults above.
              </p>
            </CardContent>
          </Card>

          <Card variant="danger">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Purge a single meeting</CardTitle>
                  <CardDescription>
                    Permanently deletes audio, transcript, and analysis. Cannot be undone.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void purge(e)} className="flex flex-col sm:flex-row gap-2">
                <label htmlFor="purge-call-id" className="sr-only">
                  Meeting (call) ID
                </label>
                <input
                  id="purge-call-id"
                  type="text"
                  value={callId}
                  onChange={(e) => setCallId(e.target.value)}
                  placeholder="Meeting (call) ID, e.g. call_abc123"
                  className="flex-1 px-3 py-2 rounded-xl bg-linear-black border border-linear-secondary text-white text-sm font-mono placeholder:text-white/30 placeholder:font-sans"
                />
                <button
                  type="submit"
                  disabled={purging}
                  className="px-4 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {purging ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {purging ? "Purging…" : "Purge meeting"}
                </button>
              </form>
              {purgeError && (
                <p role="alert" className="text-sm text-red-400 mt-3">
                  {purgeError}
                </p>
              )}
              {purgedId && (
                <p aria-live="polite" className="text-sm text-emerald-400 mt-3">
                  Meeting <span className="font-mono text-xs">{purgedId}</span> purged.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
