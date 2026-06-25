"use client";

import { useEffect } from "react";
import Nav from "@/components/nav";
import Link from "next/link";

export default function OfflinePage() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      // Already offline — leave it
      return;
    }
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 pt-36 pb-20">
        <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-medium tracking-tight mb-3">
          You&rsquo;re offline
        </h1>
        <p className="text-gray-600 text-[15px] mb-6">
          CallNote Pro needs an internet connection to transcribe calls and
          load your dashboard. Once you&rsquo;re back online, the dashboard
          and any in-progress uploads will resume automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#F26522] text-white text-[13px] font-semibold hover:bg-[#e05a1a] transition"
          >
            Try dashboard again
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold hover:bg-gray-100 transition"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}