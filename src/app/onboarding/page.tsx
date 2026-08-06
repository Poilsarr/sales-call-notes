"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Upload, Check, Mic, Sparkles } from "lucide-react";

type Step = 0 | 1 | 2;

const STORAGE_KEY = "callnote_onboarding_step";

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(0);
  const [hydrated, setHydrated] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
    const saved = Number(localStorage.getItem(STORAGE_KEY) || "0");
    if (saved === 1 || saved === 2) setStep(saved as Step);
  }, []);

  const advance = () => {
    const next = Math.min(step + 1, 2) as Step;
    setStep(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  const markOnboarded = () =>
    fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasOnboarded: true }),
    }).catch(() => {});

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "2");
    markOnboarded();
    window.location.href = "/app";
  };

  const skip = () => {
    localStorage.setItem(STORAGE_KEY, "2");
    markOnboarded();
    window.location.href = "/app";
  };

  if (!hydrated) {
    // Skeleton layout matching the final page to prevent CLS during hydration.
    return (
      <main id="main" className="min-h-screen bg-white text-gray-900">
        <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <span className="text-[13px] font-semibold tracking-tight">Gauge</span>
          <span className="text-[12px] text-gray-200">Skip onboarding</span>
        </header>
        <div className="max-w-xl mx-auto px-6 py-12" aria-hidden="true">
          <div className="flex items-center gap-2 mb-10">
            <div className="h-1 flex-1 rounded-full bg-gray-200" />
            <div className="h-1 flex-1 rounded-full bg-gray-200" />
            <div className="h-1 flex-1 rounded-full bg-gray-200" />
          </div>
          <div className="h-5 w-24 rounded bg-gray-200 animate-pulse mb-4" />
          <div className="h-10 w-3/4 rounded bg-gray-200 animate-pulse mb-3" />
          <div className="h-4 w-full rounded bg-gray-100 animate-pulse mb-2" />
          <div className="h-4 w-2/3 rounded bg-gray-100 animate-pulse mb-8" />
          <div className="h-12 w-40 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-[13px] font-semibold tracking-tight">Gauge</Link>
        <button onClick={skip} className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors">
          Skip onboarding
        </button>
      </header>

      <div className="max-w-xl mx-auto px-6 py-12">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-[#F26522]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#F26522] text-[12px] font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome
            </div>
            <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-tight mb-3">
              Get to your first call summary in 2 minutes.
            </h1>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-8">
              Three quick steps. We&apos;ll upload a sample call, run it through Whisper + GPT-4o, and show you
              what your AI-generated summary looks like. Skip anytime.
            </p>
            <button
              onClick={advance}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#F26522] text-white text-[14px] font-medium rounded-full hover:bg-[#d8581e] transition-colors"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#F26522] text-[12px] font-medium mb-4">
              <Upload className="h-3.5 w-3.5" />
              Step 1 of 2
            </div>
            <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-tight mb-3">
              Drop a sample call recording.
            </h1>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-8">
              MP3, M4A, or WAV. We transcribe with Whisper, then extract action items, decisions, and
              competitor mentions. Your file is yours — we never train a third-party model on it.
            </p>

            <label className="block border-2 border-dashed border-gray-200 hover:border-[#F26522] transition-colors rounded-2xl p-12 text-center cursor-pointer">
              <input
                type="file"
                accept="audio/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFileName(f.name);
                }}
              />
              <Upload className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <div className="text-[14px] text-gray-700 font-medium mb-1">
                {fileName ?? "Click to choose audio file"}
              </div>
              <div className="text-[12px] text-gray-400">
                Or paste a URL from your CRM (coming soon)
              </div>
            </label>

            <div className="mt-6 flex gap-3">
              <button
                onClick={advance}
                disabled={!fileName}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#F26522] text-white text-[14px] font-medium rounded-full hover:bg-[#d8581e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={advance}
                className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 text-[14px] font-medium rounded-full hover:border-gray-400 transition-colors"
              >
                <Mic className="h-4 w-4" /> Record in browser
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-[12px] font-medium mb-4">
              <Check className="h-3.5 w-3.5" />
              Ready
            </div>
            <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-tight mb-3">
              You&apos;re set. Welcome to Gauge.
            </h1>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-8">
              Your dashboard is ready. Upload a real call or pipe captions from Google Meet with our
              Chrome extension. Every call gets a Slack ping the second a competitor name shows up.
            </p>
            <div className="flex gap-3">
              <button
                onClick={finish}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#F26522] text-white text-[14px] font-medium rounded-full hover:bg-[#d8581e] transition-colors"
              >
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 text-[14px] font-medium rounded-full hover:border-gray-400 transition-colors"
              >
                See a live demo first
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}