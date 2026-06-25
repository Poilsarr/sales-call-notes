"use client";

import Nav from "@/components/nav";
import { Download, Chrome, CheckCircle2, ExternalLink } from "lucide-react";

/**
 * Chrome extension landing page.
 *
 * Two paths to install:
 *   1. Chrome Web Store (preferred) — once submitted by the team
 *   2. Manual .zip download — for users who want to load it
 *      unpacked while we wait for store approval
 *
 * The /extension/ folder in the public repo is the same source
 * we zip up for store submission. This page links to both.
 */
export default function ExtensionPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 pt-36 pb-20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#4285F4]/10 border border-[#4285F4]/20 flex items-center justify-center">
            <Chrome className="w-5 h-5 text-[#4285F4]" />
          </div>
          <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-medium tracking-tight">
            CallNote Pro for Chrome
          </h1>
        </div>
        <p className="text-gray-500 text-[15px] mb-10">
          Capture Google Meet captions live. We&rsquo;ll save your call as soon
          as you end the meeting &mdash; no upload, no post-call work.
        </p>

        {/* Primary CTA */}
        <div className="mb-12 p-6 rounded-2xl border border-gray-200 bg-gray-50">
          <h2 className="text-[15px] font-semibold mb-2">Install</h2>
          <p className="text-[13px] text-gray-600 mb-4">
            Currently in review for the Chrome Web Store. Until then, you can
            load the extension unpacked from our public repo (Chrome supports
            this for trusted open-source extensions).
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://chromewebstore.google.com/search/callnotepro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#F26522] text-white text-[13px] font-semibold hover:bg-[#e05a1a] transition"
            >
              <Chrome className="w-4 h-4" />
              Chrome Web Store
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/Poilsarr/sales-call-notes/tree/main/extension"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold hover:bg-gray-100 transition"
            >
              <Download className="w-4 h-4" />
              Download from GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-12">
          <h2 className="text-[15px] font-semibold mb-4">How it works</h2>
          <ol className="space-y-3 text-[13px] text-gray-600">
            <li className="flex gap-3">
              <span className="text-xs font-mono text-gray-400 mt-0.5">01</span>
              <div>
                <strong className="text-gray-900">Install the extension.</strong>
                Click the Chrome Web Store link above, or load unpacked from
                GitHub if you prefer to inspect the code first.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-xs font-mono text-gray-400 mt-0.5">02</span>
              <div>
                <strong className="text-gray-900">Sign in once.</strong>
                The extension uses your existing CallNote Pro login. No new
                account, no new password.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-xs font-mono text-gray-400 mt-0.5">03</span>
              <div>
                <strong className="text-gray-900">Join any Google Meet.</strong>
                The extension watches the live captions. You don&rsquo;t have to
                click anything in the extension; it works in the background.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-xs font-mono text-gray-400 mt-0.5">04</span>
              <div>
                <strong className="text-gray-900">End the meeting.</strong>
                Within ~10 seconds, the call appears in your CallNote Pro
                dashboard, fully transcribed with speakers, action items, and
                summary.
              </div>
            </li>
          </ol>
        </div>

        {/* Privacy */}
        <div className="mb-12 p-6 rounded-2xl border border-gray-200 bg-gray-50">
          <h2 className="text-[15px] font-semibold mb-2">What the extension sees</h2>
          <ul className="space-y-2 text-[13px] text-gray-600">
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                The live captions text from any Google Meet tab you have open.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                The meeting title (used as the filename in your dashboard).
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Your existing CallNote Pro login session.</span>
            </li>
          </ul>
          <p className="text-[13px] text-gray-600 mt-4">
            <strong>What it does NOT see:</strong> audio, video, screen content,
            other browser tabs, your Google account, or any non-Meet page.
            Full disclosure in our{" "}
            <a href="/privacy" className="text-[#F26522] hover:underline">
              privacy policy
            </a>
            .
          </p>
        </div>

        {/* Manifest version */}
        <div className="text-[12px] text-gray-400">
          <p>
            Manifest v3 · Source code:{" "}
            <a
              href="https://github.com/Poilsarr/sales-call-notes/tree/main/extension"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 underline"
            >
              github.com/Poilsarr/sales-call-notes/extension
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}