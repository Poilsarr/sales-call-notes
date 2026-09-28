"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Link2, Loader2, ShieldCheck } from "lucide-react";

/**
 * Part 7B — calendar visibility UI (paste-link-to-bot + auto-join toggle).
 *
 * - Paste-link card POSTs { meetingUrl, title? } to /api/v1/bots. The Clerk
 *   session travels via same-origin cookies, so no manual token header is
 *   needed. Surfaces { id, status, mode, platform } plus the pending_manual
 *   hint when no Recall key is configured (mode "manual" / status
 *   "pending_manual").
 * - Auto-join toggle GETs /api/calendar/auto-join on load and POSTs
 *   { autoJoin } on flip. Admin-only: a 403 surfaces an admin-only note.
 *
 * Relative fetch only. No secrets. No absolute URLs.
 */

type BotResult = {
  id: string;
  status: string;
  mode: string;
  platform?: string;
};

function isJoinableMeetingUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  const lower = trimmed.toLowerCase();
  return (
    lower.includes("zoom.us") ||
    lower.includes("meet.google.com") ||
    lower.includes("teams.microsoft.com")
  );
}

export function BotPanel() {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [title, setTitle] = useState("");
  const [sending, setSending] = useState(false);
  const [botError, setBotError] = useState<string | null>(null);
  const [botResult, setBotResult] = useState<BotResult | null>(null);

  const [autoJoin, setAutoJoin] = useState<boolean | null>(null);
  const [autoJoinNote, setAutoJoinNote] = useState<string | null>(null);
  const [autoJoinError, setAutoJoinError] = useState<string | null>(null);
  const [savingAutoJoin, setSavingAutoJoin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/calendar/auto-join", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as {
          autoJoin?: boolean;
          error?: string;
          code?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 403) {
            setAutoJoinNote("Admin only — only team admins can view or change auto-join.");
          } else if (data.code === "NO_TEAM") {
            setAutoJoinNote("No team yet — auto-join is unavailable until you join or create a team.");
          } else {
            setAutoJoinError(data.error || "Could not load auto-join setting.");
          }
          setAutoJoin(false);
          return;
        }
        setAutoJoin(data.autoJoin === true);
      } catch (e) {
        if (!cancelled) {
          setAutoJoin(false);
          setAutoJoinError(e instanceof Error ? e.message : "Could not load auto-join setting.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendToBot(e: React.FormEvent) {
    e.preventDefault();
    setBotError(null);
    setBotResult(null);
    const url = meetingUrl.trim();
    if (!isJoinableMeetingUrl(url)) {
      setBotError("Enter a joinable Zoom, Google Meet, or Microsoft Teams URL.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/v1/bots", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          meetingUrl: url,
          ...(title.trim() ? { title: title.trim().slice(0, 200) } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<BotResult> & {
        error?: string;
      };
      if (!data.id) {
        setBotError(data.error || "Could not send link to bot.");
        return;
      }
      setBotResult({
        id: data.id,
        status: data.status ?? "unknown",
        mode: data.mode ?? "unknown",
        platform: data.platform,
      });
      if (!res.ok && data.error) {
        setBotError(
          data.error === "BOT_DISPATCH_FAILED"
            ? "Bot dispatch failed — session kept for retry."
            : data.error,
        );
      }
    } catch (e) {
      setBotError(e instanceof Error ? e.message : "Could not send link to bot.");
    } finally {
      setSending(false);
    }
  }

  async function flipAutoJoin(next: boolean) {
    setSavingAutoJoin(true);
    setAutoJoinError(null);
    try {
      const res = await fetch("/api/calendar/auto-join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ autoJoin: next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        autoJoin?: boolean;
        error?: string;
      };
      if (!res.ok) {
        if (res.status === 403) {
          setAutoJoinNote("Admin only — only team admins can view or change auto-join.");
        }
        setAutoJoinError(data.error || "Could not update auto-join.");
        return;
      }
      setAutoJoin(data.autoJoin === true ? true : data.autoJoin === false ? false : next);
    } catch (e) {
      setAutoJoinError(e instanceof Error ? e.message : "Could not update auto-join.");
    } finally {
      setSavingAutoJoin(false);
    }
  }

  const isManual =
    botResult !== null && (botResult.mode === "manual" || botResult.status === "pending_manual");

  return (
    <section aria-label="Meeting bot controls" className="space-y-3">
      <div className="doppel-outer-dark">
        <div className="doppel-inner-dark p-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#F26522]" />
            <h2 className="text-white font-medium text-sm">Send a meeting link to the bot</h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Paste any Zoom, Google Meet, or Teams link — the bot joins and records it.
          </p>
          <form onSubmit={(e) => void sendToBot(e)} className="mt-3 space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="bot-meeting-url" className="sr-only">
                Meeting link
              </label>
              <input
                id="bot-meeting-url"
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="Paste a Zoom, Meet, or Teams link"
                className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F26522]"
              />
              <label htmlFor="bot-title" className="sr-only">
                Meeting title (optional)
              </label>
              <input
                id="bot-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                maxLength={200}
                className="sm:w-48 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F26522]"
              />
              <button
                type="submit"
                disabled={sending}
                className="rounded-full bg-[#F26522] hover:bg-[#e05a1a] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Send to bot
              </button>
            </div>
          </form>
          {botError && (
            <p role="alert" className="mt-2 text-sm text-amber-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {botError}
            </p>
          )}
          {botResult && (
            <div
              aria-live="polite"
              className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm"
            >
              <p className="text-zinc-200">
                Bot <span className="font-mono text-xs">{botResult.id}</span>
                {" · "}status: <span className="font-medium text-white">{botResult.status}</span>
                {" · "}mode: <span className="font-medium text-white">{botResult.mode}</span>
                {botResult.platform ? <>{" · "}{botResult.platform}</> : null}
              </p>
              {isManual && (
                <p className="text-xs text-zinc-400 mt-1">
                  No Recall key configured — saved as pending_manual. An admin can dispatch it
                  later from the bot queue.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="doppel-outer-dark">
        <div className="doppel-inner-dark p-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F26522]" />
              <h2 className="text-white font-medium text-sm">Auto-join upcoming meetings</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Admin only — requires the team admin role. When on, the bot joins scheduled
              meetings automatically.
            </p>
            {autoJoinNote && <p className="text-xs text-zinc-400 mt-2">{autoJoinNote}</p>}
            {autoJoinError && (
              <p role="alert" className="text-xs text-amber-400 mt-2 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
                {autoJoinError}
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 shrink-0 cursor-pointer">
            <span className="text-xs text-zinc-400">
              {autoJoin === null ? "Loading…" : savingAutoJoin ? "Saving…" : autoJoin ? "On" : "Off"}
            </span>
            <input
              id="auto-join-toggle"
              type="checkbox"
              checked={autoJoin === true}
              disabled={autoJoin === null || savingAutoJoin}
              onChange={(e) => void flipAutoJoin(e.target.checked)}
              aria-label="Auto-join upcoming meetings"
              className="w-4 h-4 accent-[#F26522]"
            />
          </label>
        </div>
      </div>
    </section>
  );
}

export default BotPanel;
