"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";

interface StickyMarketingCtaProps {
  label: string;
  href: string;
  cta: string;
}

export default function StickyMarketingCta({ label, href, cta }: StickyMarketingCtaProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const handleScroll = () => {
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
        <span className="text-[13px] font-medium text-white truncate">{label}</span>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={href}
            className="group inline-flex items-center gap-2 bg-[#C94F17] hover:bg-[#A84310] text-white text-[12px] font-medium rounded-full pl-4 pr-1.5 py-1.5 transition-colors"
          >
            <span>{cta}</span>
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
