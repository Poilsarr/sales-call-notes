"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { CheckCircle2, ArrowRight, Video, Sparkles, ExternalLink, ShieldCheck, LogIn } from "lucide-react";

export default function ConnectClient() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [status, setStatus] = useState<"loading" | "needs_sign_in" | "syncing" | "connected">("loading");
  const [plan, setPlan] = useState<string>("free");

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      setStatus("needs_sign_in");
      return;
    }

    let mounted = true;
    setStatus("syncing");

    const userId = user.id;
    const email = user.primaryEmailAddress?.emailAddress || "";
    const name = user.fullName || user.firstName || null;

    async function syncExtension() {
      let resolvedPlan = "free";

      // 1. Proactively query GET /api/v1/keys/exchange to check current plan tier in DB
      try {
        const getRes = await fetch("/api/v1/keys/exchange", { method: "GET" });
        if (getRes.ok) {
          const getData = await getRes.json();
          if (getData?.plan) {
            resolvedPlan = (getData.plan || "free").toLowerCase();
            if (mounted) setPlan(resolvedPlan);
          }
        }
      } catch (err) {
        console.warn("[ConnectClient] GET exchange warning:", err);
      }

      // 2. Immediately dispatch sync event so the extension popup updates with zero delay
      const initialSync = {
        plan: resolvedPlan,
        user: {
          id: userId,
          email,
          name,
          plan: resolvedPlan,
        },
      };

      window.dispatchEvent(
        new CustomEvent("gauge:extension-sync", { detail: initialSync })
      );
      window.postMessage({ type: "gauge:extension-sync", ...initialSync }, "*");

      try {
        localStorage.setItem("gauge_extension_auth", JSON.stringify(initialSync));
      } catch {}

      // 3. Mint session API key via POST /api/v1/keys/exchange
      try {
        const postRes = await fetch("/api/v1/keys/exchange", { method: "POST" });
        if (postRes.ok) {
          const postData = await postRes.json();
          const finalPlan = (postData?.plan || resolvedPlan).toLowerCase();
          if (mounted) setPlan(finalPlan);

          const keySync = {
            apiKey: postData.raw,
            plan: finalPlan,
            user: {
              id: userId,
              email,
              name,
              plan: finalPlan,
            },
          };

          window.dispatchEvent(
            new CustomEvent("gauge:extension-sync", { detail: keySync })
          );
          window.postMessage({ type: "gauge:extension-sync", ...keySync }, "*");

          try {
            localStorage.setItem("gauge_extension_auth", JSON.stringify(keySync));
          } catch {}
        }
      } catch (err) {
        console.warn("[ConnectClient] POST key exchange warning:", err);
      }

      if (mounted) {
        setStatus("connected");
      }
    }

    syncExtension();

    return () => {
      mounted = false;
    };
  }, [isLoaded, isSignedIn, user]);

  const isPro = plan === "pro" || plan === "business" || plan === "enterprise";

  if (!isLoaded || status === "loading") {
    return (
      <div className="bg-white/[0.035] border border-white/10 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col items-center justify-center text-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-white">Connecting Gauge Extension...</p>
        <p className="text-xs text-white/50 mt-1">Verifying your secure session</p>
      </div>
    );
  }

  if (status === "needs_sign_in" || !isSignedIn || !user) {
    return (
      <div className="bg-white/[0.035] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Gauge Extension</h1>
            <p className="text-xs text-white/50">Meeting Notes & Live Audio Sync</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 mb-6 text-center">
          <p className="text-sm font-medium text-white mb-1.5">Sign in to Connect</p>
          <p className="text-xs text-white/60 mb-5">
            Connect your Gauge account so meeting captions, audio, and AI summaries sync directly into your dashboard.
          </p>
          <Link
            href="/sign-in?redirect_url=/extension/connect"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[0.99]"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Gauge</span>
          </Link>
        </div>
      </div>
    );
  }

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
            <p className="text-xs text-white/60 truncate mt-0.5">
              {user.primaryEmailAddress?.emailAddress || user.fullName || "User"}
            </p>
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
