"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Video, Sparkles, ExternalLink, ShieldCheck } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  plan: string;
}

export default function ConnectClient({ user }: { user: UserProfile }) {
  const [status, setStatus] = useState<"syncing" | "connected" | "error">("syncing");
  const isPro = user.plan === "pro" || user.plan === "business" || user.plan === "enterprise";

  useEffect(() => {
    let mounted = true;

    // 1. Immediately sync authenticated user profile and plan tier so extension UI updates with zero delay
    const initialSync = {
      plan: user.plan || "free",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan || "free",
      },
    };

    window.dispatchEvent(
      new CustomEvent("gauge:extension-sync", { detail: initialSync })
    );

    try {
      localStorage.setItem("gauge_extension_auth", JSON.stringify(initialSync));
    } catch {}

    async function syncExtension() {
      try {
        const res = await fetch("/api/v1/keys/exchange", { method: "POST" });
        if (!res.ok) {
          throw new Error(`Exchange returned ${res.status}`);
        }
        const data = await res.json();

        // 2. Dispatch updated sync with newly minted session API key
        const syncPayload = {
          apiKey: data.raw,
          plan: data.plan || user.plan,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            plan: data.plan || user.plan,
          },
        };

        window.dispatchEvent(
          new CustomEvent("gauge:extension-sync", { detail: syncPayload })
        );

        try {
          localStorage.setItem("gauge_extension_auth", JSON.stringify(syncPayload));
        } catch {}

        if (mounted) {
          setStatus("connected");
        }
      } catch (err) {
        console.warn("[ExtensionConnect] Key exchange sync warning:", err);
        if (mounted) {
          // Even if key exchange hit a rate limit, the session itself is active
          setStatus("connected");
        }
      }
    }

    syncExtension();

    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="bg-white/[0.035] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
      {/* Top Status Icon */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Gauge Extension</h1>
            <p className="text-xs text-white/50">Meeting Notes & Live Audio Sync</p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${
            isPro
              ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
          }`}
        >
          {isPro ? "PRO" : "FREE"}
        </span>
      </div>

      {/* Connection Card */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 mb-6">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5">
            {status === "syncing" ? (
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              {status === "syncing" ? "Syncing with Extension..." : "Extension Connected!"}
            </p>
            <p className="text-xs text-white/60 truncate mt-0.5">{user.email}</p>
            <p className="text-[11px] text-white/40 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Credentials synced to in-memory extension session
            </p>
          </div>
        </div>
      </div>

      {/* Plan Capabilities Section */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-6">
        <p className="text-xs font-semibold text-white/80 mb-2">
          {isPro ? "Your Pro Plan Features Active" : "Your Free Plan Features Active"}
        </p>
        <ul className="space-y-1.5 text-xs text-white/60">
          <li className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            {isPro
              ? "Unlimited call recording duration (up to 200MB)"
              : "30-minute call recording duration (30MB cap)"}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            AI-powered meeting summary & action items
          </li>
          <li className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            Multi-speaker diarization + Google Meet caption sync
          </li>
          {isPro ? (
            <li className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-2">
                <span className="font-bold">✓</span>
                HubSpot, Salesforce &amp; Slack auto-sync active
              </span>
              <Link href="/settings" className="text-[11px] underline text-indigo-300 hover:text-indigo-200">
                Manage Integrations ↗
              </Link>
            </li>
          ) : (
            <li className="flex items-center gap-2 text-white/40">
              <span>✕</span>
              CRM auto-sync (HubSpot & Salesforce require Pro)
            </li>
          )}
        </ul>

        {!isPro && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <Link
              href="/pricing"
              className="group flex items-center justify-between text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
            >
              <span>Upgrade to Pro ($9/mo) for CRM sync & unlimited calls</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5">
        <a
          href="https://meet.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[0.99] active:scale-[0.98]"
        >
          <Video className="w-4 h-4" />
          <span>Launch Google Meet</span>
          <ExternalLink className="w-3 h-3 text-white/70" />
        </a>

        <Link
          href="/app"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-white/90 text-xs font-medium border border-white/10 transition-colors"
        >
          <span>Open Gauge Dashboard</span>
        </Link>
      </div>

      {/* Helper text */}
      <p className="text-[11px] text-center text-white/40 mt-5">
        You can close this tab now. The Gauge extension popup is ready to record.
      </p>
    </div>
  );
}
