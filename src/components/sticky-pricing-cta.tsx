"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function StickyPricingCta() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const handleScroll = () => {
      // Show after scrolling past the hero (~600px).
      setVisible(window.scrollY > 600);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [dismissed]);

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-xl animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-[#0a0a0b]/95 backdrop-blur-md border border-white/10 rounded-full pl-5 pr-2 py-2 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="hidden sm:inline text-[13px] font-medium text-white truncate">
            Start with 300 free minutes/mo
          </span>
          <span className="sm:hidden text-[13px] font-medium text-white truncate">
            300 free minutes/mo
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/sign-up"
            onClick={() => trackEvent("pricing_cta_click", { section: "sticky" })}
            className="group inline-flex items-center gap-2 bg-[#C94F17] hover:bg-[#A84310] text-white text-[12px] font-medium rounded-full pl-4 pr-1.5 py-1.5 transition-colors"
          >
            <span>Start free</span>
            <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center transition-transform group-hover:-rotate-45">
              <ArrowRight size={11} className="text-[#C94F17]" />
            </span>
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-2 text-white/50 hover:text-white transition"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
