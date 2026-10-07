"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { getPostHogDistinctId, identifyPostHogLead } from "@/lib/posthog";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LEAD_SOURCE = "footer";
const LEAD_CTA_ID = "footer-newsletter";

function collectAttribution(): Record<string, string> {
  const extra: Record<string, string> = {};
  if (typeof window === "undefined") return extra;

  const landingPage = window.location.href.slice(0, 1024);
  if (landingPage) extra.landingPage = landingPage;

  const referrer = (document.referrer || "").slice(0, 1024);
  if (referrer) extra.referrer = referrer;

  try {
    const params = new URLSearchParams(window.location.search);
    const utmKeys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ] as const;
    for (const k of utmKeys) {
      const v = params.get(k);
      if (v) extra[k] = v.slice(0, 128);
    }
  } catch {
    // Analytics must never break the form.
  }

  return extra;
}

export default function FooterLeadForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");

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
      const distinctId = getPostHogDistinctId() ?? undefined;
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: LEAD_SOURCE,
          ctaId: LEAD_CTA_ID,
          distinctId,
          ...collectAttribution(),
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
      setStatus("done");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="mt-6">
        <p className="flex items-center gap-2 text-[13px] text-emerald-400">
          <CheckCircle2 size={16} aria-hidden="true" />
          You&apos;re on the list — see you in your inbox.
        </p>
        <p className="mt-1 text-[12px] text-white/40">
          We sent a confirmation to {email.trim()}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-[260px]" noValidate={false}>
      <label
        htmlFor="footer-newsletter-email"
        className="block text-[11px] uppercase tracking-[0.18em] text-white/40 font-medium mb-2"
      >
        Get product updates
      </label>
      <div className="flex flex-col gap-2">
        <input
          id="footer-newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email address"
          aria-describedby={status === "error" ? "footer-newsletter-error" : undefined}
          disabled={status === "submitting"}
          className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/30 text-[13px] focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50"
        />
        {status === "error" && (
          <p id="footer-newsletter-error" role="alert" className="text-[12px] text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-black text-[13px] font-medium rounded-full px-5 py-2 transition-colors"
        >
          {status === "submitting" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
    </form>
  );
}
