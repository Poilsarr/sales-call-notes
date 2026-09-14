"use client";

import { useEffect, useState } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/**
 * Hero call-to-action. Client-only because it reads Clerk session.
 * Isolated as a small island so the rest of the landing page can be
 * a server component (zero JS for the static sections).
 *
 * PR-2 analytics: fires `hero_view {variant}` once on mount and
 * `cta_click {id, section, signedIn}` on press. Anonymous-only
 * properties — no email or clerkId is ever sent.
 */
export function HeroCTA({ placement = "hero" }: { placement?: string }) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Hero impression — fired once on mount (variant B per FRONTPAGE-PITCH-PLAN §4 A/B key).
  useEffect(() => {
    trackEvent("hero_view", { variant: "B" });
  }, []);

  const signedIn = mounted && !!user;
  const ctaId = signedIn ? "hero_dashboard" : "hero_start_free";
  const handleClick = () => {
    trackEvent("cta_click", { id: ctaId, section: placement, signedIn });
  };

  // Render the "Start free" button before hydration to avoid a flash of
  // unauthenticated content for already-signed-in users. After mount we
  // switch to "Open dashboard" if the user is signed in.
  if (mounted && user) {
    return (
      <Link
        href="/app/intelligence"
        data-placement={placement}
        onClick={handleClick}
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
        onClick={handleClick}
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