"use client";

import { useState, useEffect } from "react";
import { X, Gift } from "lucide-react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

const SHOWN_KEY = "pricing-exit-intent-shown";

export default function ExitIntentModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only run on desktop. Touch devices don't trigger the mouse-leave
    // pattern we use, and the modal is too disruptive on mobile.
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const alreadyShown = sessionStorage.getItem(SHOWN_KEY) === "true";
    if (alreadyShown) return;

    let triggered = false;
    const handleLeave = (e: MouseEvent) => {
      if (triggered) return;
      // Trigger when the cursor exits the viewport near the top (tab bar).
      if (e.clientY < 10) {
        triggered = true;
        setShow(true);
        sessionStorage.setItem(SHOWN_KEY, "true");
        trackEvent("pricing_exit_intent_shown");
      }
    };

    // Wait a few seconds so we don't fire for casual cursor movement.
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleLeave);
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-900 transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-full bg-[#F26522]/10 flex items-center justify-center mx-auto mb-4">
          <Gift size={22} className="text-[#F26522]" />
        </div>

        <h3 className="text-[1.25rem] font-semibold text-gray-900 mb-2">
          Not ready to upgrade?
        </h3>
        <p className="text-[13px] text-gray-500 mb-6">
          Start with 300 free transcription minutes every month. No credit card, no bot joining your calls.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/sign-up"
            onClick={() => trackEvent("pricing_exit_intent_click")}
            className="inline-flex items-center justify-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] font-medium rounded-full px-6 py-2.5 transition-colors"
          >
            Start free
          </Link>
          <button
            onClick={() => setShow(false)}
            className="text-[13px] text-gray-500 hover:text-gray-900 underline-offset-2 hover:underline"
          >
            Keep exploring
          </button>
        </div>
      </div>
    </div>
  );
}
