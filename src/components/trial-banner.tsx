"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

const DISMISSED_KEY = "trial-banner-dismissed";

interface TrialBannerProps {
  trialEndsAt: string | Date | null | undefined;
}

export default function TrialBanner({ trialEndsAt }: TrialBannerProps) {
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

  if (dismissed || !trialEndsAt) return null;

  const trialDate = new Date(trialEndsAt);
  const now = new Date();
  const diff = trialDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (daysRemaining > 7) return null;

  let bg: string;
  let text: string;
  if (daysRemaining <= 1) {
    bg = "bg-red-600";
    text = "text-white";
  } else if (daysRemaining <= 3) {
    bg = "bg-orange-500";
    text = "text-white";
  } else {
    bg = "bg-amber-400";
    text = "text-black";
  }

  return (
    <div className={`${bg} ${text} px-4 py-2.5 flex items-center justify-between text-sm`}>
      <span>
        Your trial ends in <strong>{daysRemaining} day{daysRemaining === 1 ? "" : "s"}</strong>.
        <a href="/billing" className="ml-2 underline font-semibold hover:opacity-80">
          Upgrade now
        </a>{" "}
        to keep full access.
      </span>
      <button
        onClick={handleDismiss}
        className="p-1 hover:opacity-70 shrink-0 ml-4"
        aria-label="Dismiss trial banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
