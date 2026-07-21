"use client";

import { useState, useEffect, useCallback } from "react";
import { X, AlertTriangle } from "lucide-react";

const DISMISSED_KEY = "usage-upgrade-banner-dismissed";

interface UsageLimitBannerProps {
  plan: string | null | undefined;
  usage: number;
  limit: number | "unlimited";
  minuteUsage: number;
  minuteLimit: number | "unlimited";
}

export default function UsageLimitBanner({
  plan,
  usage,
  limit,
  minuteUsage,
  minuteLimit,
}: UsageLimitBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  }, []);

  if (dismissed || !plan || plan.toLowerCase() !== "free") return null;

  const callLimit = typeof limit === "number" ? limit : Infinity;
  const minLimit = typeof minuteLimit === "number" ? minuteLimit : Infinity;

  const callPct = callLimit > 0 ? usage / callLimit : 0;
  const minutePct = minLimit > 0 ? minuteUsage / minLimit : 0;

  const threshold = 0.8;
  const show = callPct >= threshold || minutePct >= threshold;

  if (!show) return null;

  const highestPct = Math.max(callPct, minutePct);
  const isNearLimit = highestPct >= 0.95;
  const pctDisplay = Math.round(highestPct * 100);

  return (
    <div
      className={`px-4 py-2.5 flex items-center justify-between text-sm ${
        isNearLimit ? "bg-red-600 text-white" : "bg-amber-400 text-black"
      }`}
    >
      <span className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        <span>
          You&apos;ve used <strong>{pctDisplay}%</strong> of your free monthly limit.
          <a
            href="/billing"
            className="ml-2 underline font-semibold hover:opacity-80"
          >
            Upgrade for unlimited
          </a>
        </span>
      </span>
      <button
        onClick={handleDismiss}
        className="p-1 hover:opacity-70 shrink-0 ml-4"
        aria-label="Dismiss usage banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
