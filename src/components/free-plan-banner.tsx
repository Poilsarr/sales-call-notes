"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Zap } from "lucide-react";

const DISMISSED_KEY = "free-plan-banner-dismissed";

interface FreePlanBannerProps {
  plan: string | null | undefined;
}

export default function FreePlanBanner({ plan }: FreePlanBannerProps) {
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

  return (
    <div className="bg-[#F26522] text-white px-4 py-2.5 flex items-center justify-between text-sm">
      <span className="flex items-center gap-2">
        <Zap className="w-4 h-4" />
        <span>
          You&apos;re on the <strong>Free</strong> plan. Upgrade to Pro for unlimited calls, CRM sync, and team features.
        </span>
        <a
          href="/pricing"
          className="ml-2 underline font-semibold hover:opacity-80 shrink-0"
        >
          Upgrade now
        </a>
      </span>
      <button
        onClick={handleDismiss}
        className="p-1 hover:opacity-70 shrink-0 ml-4"
        aria-label="Dismiss free plan banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
