"use client";

import { useEffect, useState } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Hero call-to-action. Client-only because it reads Clerk session.
 * Isolated as a small island so the rest of the landing page can be
 * a server component (zero JS for the static sections).
 *
 * `placement` is reserved for PR-B `cta_click {placement}` analytics;
 * rendered as a data attribute only — no track() call here (PR-A is UI-only).
 */
export function HeroCTA({ placement = "hero" }: { placement?: string }) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Render the "Start free" button before hydration to avoid a flash of
  // unauthenticated content for already-signed-in users. After mount we
  // switch to "Open dashboard" if the user is signed in.
  if (mounted && user) {
    return (
      <Link
        href="/app/intelligence"
        data-placement={placement}
        className="group inline-flex items-center gap-2 bg-[#C94F17] hover:bg-[#A84310] text-white text-[13px] sm:text-[14px] rounded-full pl-5 sm:pl-6 pr-2 py-2"
      >
        <span>Open dashboard</span>
        <span className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
          <ArrowRight size={14} className="text-[#F26522]" />
        </span>
      </Link>
    );
  }

  return (
    <SignInButton mode="modal">
      <button
        data-placement={placement}
        className="group inline-flex items-center gap-2 bg-[#C94F17] hover:bg-[#A84310] text-white text-[13px] sm:text-[14px] rounded-full pl-5 sm:pl-6 pr-2 py-2"
      >
        <span>Start free</span>
        <span className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
          <ArrowRight size={14} className="text-[#F26522]" />
        </span>
      </button>
    </SignInButton>
  );
}