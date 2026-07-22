"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight, Loader2, AlertTriangle } from "lucide-react";

export default function WelcomePage() {
  const [status, setStatus] = useState<"syncing" | "success" | "error">("syncing");
  const [plan, setPlan] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/sync", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.synced) {
          setPlan(data.plan);
          setStatus("success");
        } else if (data.success === true && data.synced === false) {
          setStatus("error");
          setErrorMsg(data.message || "No active subscription found.");
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Could not verify subscription.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Network error. Your payment went through — refresh this page in a moment.");
      });
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-20">
        <div className="max-w-md w-full text-center">
          {status === "syncing" && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#F26522]/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 size={32} className="text-[#F26522] animate-spin" />
              </div>
              <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
                Verifying your subscription...
              </h1>
              <p className="text-gray-500 text-[14px]">
                Just a moment while we activate your plan.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
                You&apos;re all set!
              </h1>
              <p className="text-gray-500 text-[14px] mb-2">
                Your <strong className="text-gray-900">{plan === "pro" ? "Pro" : "Business"}</strong> plan is now active.
              </p>
              <p className="text-gray-400 text-[13px] mb-8">
                Unlimited uploads, no limits. We&apos;ve emailed your receipt.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/app"
                  className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300"
                >
                  <span className="flex flex-col overflow-hidden h-[20px]">
                    <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                      Go to dashboard
                    </span>
                    <span className="leading-[20px]">Go to dashboard</span>
                  </span>
                  <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                    <ArrowRight size={14} className="text-[#F26522]" />
                  </span>
                </Link>
                <Link
                  href="/billing"
                  className="px-5 py-2.5 rounded-full text-[13px] font-medium border border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition"
                >
                  Manage billing
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
                Payment received, but...
              </h1>
              <p className="text-gray-500 text-[14px] mb-2">
                Your payment went through — we got the invoice. We just couldn&apos;t
                automatically activate your plan.
              </p>
              <p className="text-gray-400 text-[13px] mb-1 font-mono text-xs">
                {errorMsg}
              </p>
              <p className="text-gray-400 text-[13px] mb-8">
                Go to billing and click <strong>Refresh subscription</strong> to apply it.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/billing"
                  className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full px-6 py-2.5 transition-colors duration-300"
                >
                  Refresh subscription
                </Link>
                <Link
                  href="/app"
                  className="px-5 py-2.5 rounded-full text-[13px] font-medium border border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition"
                >
                  Go to app anyway
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
