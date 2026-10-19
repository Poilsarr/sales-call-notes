import Link from "next/link";
import Nav from "@/components/nav";
import { HeroCTA } from "@/components/hero-cta";
import { HeroScrubbableVideo } from "@/components/hero-scrubbable-video";
import { StudioShowcaseBento } from "@/components/studio-showcase-bento";
import { StudioProductArchitecture } from "@/components/studio-product-architecture";
import { StudioPersonaSwitcher } from "@/components/studio-persona-switcher";
import { StudioSocialProof } from "@/components/studio-social-proof";
import { StudioIntegrationsGrid } from "@/components/studio-integrations-grid";
import PricingTeaser from "@/components/pricing-teaser";
import FinalCta from "@/components/final-cta";
import SeoLinks from "@/components/seo-links";
import StickyMarketingCta from "@/components/sticky-marketing-cta";
import { HOMEPAGE_COPY } from "@/lib/homepage-copy";
import { Play } from "lucide-react";

export const metadata = {
  title: "Gauge — AI Sales Call Notes & Competitive Intelligence",
  description:
    "Gauge turns sales calls into structured notes, live battlecards, and real-time competitive alerts. Capture Google Meet directly in your browser with zero bots.",
};

/**
 * Gauge Studio Landing Page
 *
 * Streamlined, high-graphics studio layout inspired by Otter.ai:
 * 1. Hero: Virtual competitor value proposition + scrubbable product video.
 * 2. Studio Showcase Bento: In-call battlecards, 0-bot extension, live waveform transcript, and automated CRM checklist.
 * 3. Product Architecture: Extension (in-call weapon for reps) vs. Web Hub (call database for revenue leaders).
 * 4. Revenue Persona Switcher: Interactive role pills (AEs, VP Sales, RevOps, PMM, Founders).
 * 5. High-Trust Social Proof: Real customer proof, ecosystem badges, and security standard.
 * 6. Connected Integrations: Google Meet, Zoom, Slack, HubSpot, Salesforce, Claude.
 * 7. Transparent Self-Serve Pricing & Closing Studio CTA.
 */
export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="min-h-screen bg-[#F8F9FA] text-gray-900 pb-20 lg:pb-0">
        {/* HERO SECTION */}
        <section className="relative lg:min-h-[100dvh] flex flex-col overflow-hidden bg-white border-b border-black/[0.05]">
          {/* Subtle Atmosphere Ribbon */}
          <svg
            className="absolute inset-x-0 top-[8%] w-full h-[420px] pointer-events-none"
            viewBox="0 0 1440 420"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M-20,330 C200,170 360,170 520,290 C680,410 840,410 1000,290 C1160,170 1300,190 1460,290"
              fill="none"
              stroke="#F26522"
              strokeWidth="4"
              opacity="0.10"
              strokeLinecap="round"
            />
          </svg>
          <div className="hidden lg:block flex-1" />

          <div className="relative z-20 w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-14 sm:pb-16 lg:pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center lg:items-stretch">
              {/* LEFT: Headline + Subhead + CTAs */}
              <div className="self-center">
                <p className="text-[13px] leading-[14px] text-gray-700 font-medium tracking-wide mb-5 sm:mb-8">
                  {HOMEPAGE_COPY.eyebrow}
                </p>
                <h1 className="text-[clamp(1.75rem,7vw,4.2rem)] sm:text-[clamp(2.5rem,5vw,4.2rem)] font-semibold sm:font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 text-balance">
                  {HOMEPAGE_COPY.heroH1.split(HOMEPAGE_COPY.heroH1Highlight)[0]}
                  <span className="text-[#F26522] underline decoration-[#F26522]/50 decoration-[0.08em] underline-offset-[0.12em]">
                    {HOMEPAGE_COPY.heroH1Highlight}
                  </span>
                  {HOMEPAGE_COPY.heroH1.split(HOMEPAGE_COPY.heroH1Highlight)[1]}
                </h1>
                <p className="text-[15px] sm:text-base text-gray-700 max-w-xl mt-4 mb-3 leading-relaxed">
                  {HOMEPAGE_COPY.heroSub}
                </p>

                <div className="inline-flex items-center gap-2 text-[11px] font-mono font-medium bg-white border border-black/[0.06] text-gray-700 rounded-full px-3 py-1 mb-5 shadow-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F26522]" />
                  {HOMEPAGE_COPY.betaLine}
                </div>

                <div className="flex flex-row items-center gap-3 sm:gap-4 flex-wrap">
                  <HeroCTA placement="hero" />
                  <Link
                    href={HOMEPAGE_COPY.ctas.secondaryHref}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-gray-900 px-5 py-3 min-h-[44px] text-[13px] sm:text-[14px] font-medium text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    <Play size={14} />
                    <span>{HOMEPAGE_COPY.ctas.secondary}</span>
                  </Link>
                  <Link
                    href={HOMEPAGE_COPY.ctas.tertiaryHref}
                    className="inline-flex items-center min-h-[44px] text-[13px] text-gray-600 hover:text-gray-900 font-medium underline-offset-4 hover:underline"
                  >
                    {HOMEPAGE_COPY.ctas.tertiary}
                  </Link>
                </div>

                {/* Pictorial trust pill row */}
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-gray-700">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <span>0 bots in meetings</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="w-4 h-4 rounded-full bg-[#F26522]/15 text-[#F26522] flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <span>Instant Slack rival alerts</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <span>60s notes to HubSpot &amp; Salesforce</span>
                  </span>
                </div>

                <ul className="mt-4 space-y-1.5 text-[13px] text-gray-600">
                  {HOMEPAGE_COPY.heroManagerBullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-[7px] w-1.5 h-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RIGHT: Scrubbable Video Player */}
              <div className="h-full">
                <HeroScrubbableVideo />
              </div>
            </div>
          </div>
        </section>

        {/* 1. STUDIO SHOWCASE BENTO (Matching Otter Screenshot 1 & 2) */}
        <StudioShowcaseBento />

        {/* 2. PRODUCT ARCHITECTURE: Extension vs. Web Database */}
        <StudioProductArchitecture />

        {/* 3. REVENUE PERSONA SWITCHER (Matching Otter Screenshot 3) */}
        <StudioPersonaSwitcher />

        {/* 4. SOCIAL PROOF & TRUST (Matching Otter Screenshot 4) */}
        <StudioSocialProof />

        {/* 5. CONNECTED APP ECOSYSTEM (Matching Otter Screenshot 5) */}
        <StudioIntegrationsGrid />

        {/* 6. TRANSPARENT PRICING TEASER ($0 / $9 / $29) */}
        <PricingTeaser />

        {/* 7. FINAL STUDIO CTA */}
        <FinalCta />

        {/* SEO LINKS */}
        <SeoLinks />

        {/* STICKY BOTTOM MOBILE CTA */}
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <HeroCTA />
        </div>

        {/* STICKY DESKTOP CTA */}
        <div className="hidden lg:block">
          <StickyMarketingCta label="Start with 300 free minutes/mo" href="/sign-up" cta="Start free" />
        </div>
      </main>
    </>
  );
}
