"use client";

import { useState, useEffect } from "react";
import { X, Gift, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { getPostHogDistinctId, identifyPostHogLead } from "@/lib/posthog";

const SHOWN_KEY = "pricing-exit-intent-shown";
const LEAD_SOURCE = "pricing-exit-intent";
const LEAD_CTA_ID = "exit-intent";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ExitIntentModal() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    // Only run on desktop. Touch devices don't trigger the mouse-leave
    // pattern we use, and the modal is too disruptive on mobile.
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const alreadyShown = sessionStorage.getItem(SHOWN_KEY) === "true";
    if (alreadyShown) return;

    // Listener is attached immediately but stays inert until the arm timer
    // fires, so cleanup can always remove it synchronously with the effect.
    let armed = false;
    const armTimer = setTimeout(() => {
      armed = true;
    }, 3000);

    let triggered = false;
    const handleLeave = (e: MouseEvent) => {
      if (!armed || triggered) return;
      // Trigger when the cursor exits the viewport near the top (tab bar).
      if (e.clientY < 10) {
        triggered = true;
        setShow(true);
        sessionStorage.setItem(SHOWN_KEY, "true");
        trackEvent("pricing_exit_intent_shown");
      }
    };

    document.addEventListener("mouseleave", handleLeave);

    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: LEAD_SOURCE,
          ctaId: LEAD_CTA_ID,
          distinctId: getPostHogDistinctId() ?? undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      identifyPostHogLead(trimmed);
      trackEvent("lead_captured", { source: LEAD_SOURCE, ctaId: LEAD_CTA_ID });
      trackEvent("pricing_exit_intent_click");
      setStatus("done");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

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

        {status === "done" ? (
          <div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={22} className="text-emerald-600" />
            </div>
            <p className="text-[13px] text-gray-600 mb-6">
              You&apos;re on the list — we&apos;ll send your free minutes to {email.trim()}.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                onClick={() => trackEvent("pricing_exit_intent_click")}
                className="inline-flex items-center justify-center gap-2 bg-[#C94F17] hover:bg-[#A84310] text-white text-[13px] font-medium rounded-full px-6 py-2.5 transition-colors"
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
        ) : (
          <div>
            <form onSubmit={submit} className="flex flex-col gap-3 mb-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                aria-label="Email address"
                disabled={status === "submitting"}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-gray-900 placeholder-gray-400 text-[13px] focus:outline-none focus:border-[#F26522] transition-colors disabled:opacity-50"
              />
              {status === "error" && (
                <p role="alert" className="text-[12px] text-red-600">{error}</p>
              )}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex items-center justify-center gap-2 bg-[#C94F17] hover:bg-[#A84310] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-medium rounded-full px-6 py-2.5 transition-colors"
              >
                {status === "submitting" ? "Saving…" : "Email me my free minutes"}
              </button>
            </form>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                onClick={() => trackEvent("pricing_exit_intent_click")}
                className="text-[13px] font-medium text-[#C94F17] hover:text-[#A84310] transition-colors"
              >
                Start free now
              </Link>
              <button
                onClick={() => setShow(false)}
                className="text-[13px] text-gray-500 hover:text-gray-900 underline-offset-2 hover:underline"
              >
                Keep exploring
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
