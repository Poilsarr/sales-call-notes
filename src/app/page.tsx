import Link from "next/link";
import Nav from "@/components/nav";
import SocialProof from "@/components/social-proof";
import PersonasTabs from "@/components/personas-tabs";
import RoiCalculator from "@/components/roi-calculator";
import HowItWorks from "@/components/how-it-works";
import Differentiators from "@/components/differentiators";
import VsTeaser from "@/components/vs-teaser";
import UseCases from "@/components/use-cases";
import FinalCta from "@/components/final-cta";
import { HeroCTA } from "@/components/hero-cta";
import { HeroScrubbableVideo } from "@/components/hero-scrubbable-video";
import { ScrubSummarySection } from "@/components/scrub-summary-section";
import { HeroEvidenceStack } from "@/components/hero-evidence-stack";
import { HeroVideoPlayer } from "@/components/hero-video-player";
import { TeamShowcase } from "@/components/team-showcase";
import { WhoWeAre } from "@/components/who-we-are";
import StickyMarketingCta from "@/components/sticky-marketing-cta";
import ProblemSection from "@/components/problem-section";
import TrustStrip from "@/components/trust-strip";
import LiveProofStrip from "@/components/live-proof-strip";
import ObjectionTrio from "@/components/objection-trio";
import PricingTeaser from "@/components/pricing-teaser";
import SeoLinks from "@/components/seo-links";
import { ProductVisualsSection } from "@/components/product-visuals-section";
import CapabilitiesBento from "@/components/capabilities-bento";
import RadarMoat from "@/components/radar-moat";
import { HOMEPAGE_COPY } from "@/lib/homepage-copy";
import { FILM_HERO_ALERT } from "@/lib/demo-call-fiction";
import { Crosshair, Play } from "lucide-react";

export const metadata = {
  title: "Gauge — AI Sales Call Notes & Competitive Intelligence",
  description: "Gauge turns sales calls into structured notes, action items, and real-time competitive alerts. Upload, record, or capture from Google Meet.",
};

// Server component — zero JS shipped for the static landing content.
// Only the CTA island runs client-side.
export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="min-h-screen bg-[#EFEFEF] text-gray-900 pb-20 lg:pb-0">
        {/* HERO — on tall viewports the column flex stretches the hero; on mobile
          we use natural flow so the content doesn't sit in the middle of a
          sea of empty space. */}
        <section className="relative lg:min-h-[100dvh] flex flex-col overflow-hidden bg-white">
          {/* Otter-style decorative blobs (peach/blue, pointer-events-none) */}
          <div
            aria-hidden
            className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#FFF4ED] blur-3xl pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-[#EFF4FF] blur-3xl pointer-events-none"
          />
          {/* Soft atmosphere — single peach ribbon (Gauge Radar; no film grain) */}
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
        <div className="relative z-20 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-14 sm:pb-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center lg:items-stretch">
            {/* LEFT: headline + sub + CTAs.
                Hero script per FRONTPAGE-PITCH-PLAN §4: plain-English What-line
                + dual CTA (Otter.ai pattern: name the job in one line, one primary action). */}
            <div className="self-center">
              <p className="text-[13px] leading-[14px] text-gray-700 font-medium tracking-wide mb-5 sm:mb-8">{HOMEPAGE_COPY.eyebrow}</p>
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
                <Link href={HOMEPAGE_COPY.ctas.tertiaryHref} className="inline-flex items-center min-h-[44px] text-[13px] text-gray-600 hover:text-gray-900 font-medium underline-offset-4 hover:underline">
                  {HOMEPAGE_COPY.ctas.tertiary}
                </Link>
              </div>
              <ul className="mt-5 space-y-1.5 text-[13px] text-gray-600">
                {HOMEPAGE_COPY.heroManagerBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-[7px] w-1.5 h-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* RIGHT: video only — scrub list lives below the fold in
                <ScrubSummarySection/> and drives this player via gauge:scrub. */}
            <div className="h-full">
              <HeroScrubbableVideo />
            </div>
          </div>

        </div>
      </section>

      {/* Scrub companion moved below the fold (HOMEPAGE-V2): hero-right is
          video only; these lines scrub it via the gauge:scrub event. */}
      <ScrubSummarySection />
      <TrustStrip />

      <HeroEvidenceStack />

      {/* PROOF STRIP + PROBLEM — FRONTPAGE-PITCH-PLAN §2-3 (Uber-deck slides 2-3).
          Rendered directly below the hero; sections 5-9 below are untouched. */}
      <ProblemSection />

      {/* PRODUCT VISUALS — photo-real proof right after the pitch+trust unit */}
      <ProductVisualsSection />

      {/* CAPABILITIES — visual bento (each capability ships with a product visual) */}
      <CapabilitiesBento />

      {/* HOW IT WORKS — 4-step process from upload to CRM push */}
      <HowItWorks />

      {/* RADAR MOAT — dark band breaking into the film wedge */}
      <RadarMoat />

      <PersonasTabs />

      <ObjectionTrio />

      {/* WHO IT'S FOR (social proof — honest, no fake brand names) */}
      <SocialProof />
      <LiveProofStrip />

      <Differentiators />
      <VsTeaser />
      <UseCases />

      {/* ROI CALCULATOR (honest math, all inputs user-controlled) */}
      <RoiCalculator />

      <PricingTeaser />

      {/* COMPETITIVE INTEL DEMO — one hero sample alert (fiction SSOT). */}
      <section data-track-section="film" className="bg-[#0a0a0b] text-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28 scroll-mt-24">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-10 lg:mb-14">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#F26522] mb-3">
              <Crosshair size={12} /> The wedge
            </div>
            <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
              We tell you the second a competitor enters a deal.
            </h2>
            <p className="text-white/75 text-[14px]">
              Not a weekly report. Not a dashboard nobody opens. A real-time ping with the exact call,
              the speaker, and the line where it happened.
            </p>
          </div>
          <HeroVideoPlayer fullBleed />

          <div className="mt-10 lg:mt-14 max-w-xl">
            <div className="doppel-outer-dark">
              <div className="doppel-inner-dark p-5 sm:p-6 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-5">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: FILM_HERO_ALERT.accent }}
                  />
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/70 font-mono">
                    Live alert
                  </span>
                  <span className="ml-auto text-[10px] font-mono text-white/60">
                    {FILM_HERO_ALERT.age}
                  </span>
                </div>

                <div className="font-mono text-[12px] space-y-2.5 mb-5">
                  <div className="flex items-start gap-3">
                    <span className="text-white/60 shrink-0 w-14">
                      {FILM_HERO_ALERT.timestamp}
                    </span>
                    <div>
                      <span className="text-white/85">{FILM_HERO_ALERT.speaker}: </span>
                      <span className="text-white/90">
                        &ldquo;{FILM_HERO_ALERT.quote}&rdquo;
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mt-auto">
                  <div className="flex items-start gap-2.5 text-[11.5px]">
                    <Crosshair
                      size={13}
                      className="mt-0.5 shrink-0"
                      style={{ color: FILM_HERO_ALERT.accent }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold mb-0.5">
                        Competitor detected: {FILM_HERO_ALERT.rival}
                      </div>
                      <div className="text-white/70 text-[10.5px]">
                        {FILM_HERO_ALERT.callName} · confidence{" "}
                        {FILM_HERO_ALERT.confidence}
                      </div>
                      <div className="text-white/60 text-[10.5px] mt-0.5 truncate">
                        Slack ping → {FILM_HERO_ALERT.slackChannel}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[12px] text-white/75 mt-6 max-w-2xl">
            Sample alert — shown for product demo. In production,
            alerts fire in real time across all your active calls.
          </p>
        </div>
      </section>

      {/* TEAM — frontal: trust right after the pitch */}
      <TeamShowcase />

      <WhoWeAre />

      {/* FINAL CTA — closing conversion touchpoint before footer */}
      <FinalCta />

      <SeoLinks />

      {/* CHROME EXTENSION — Meet still + copy */}
      <section className="px-5 sm:px-8 lg:px-12 py-12 sm:py-16">
        <div className="max-w-[1100px] mx-auto doppel-outer">
          <div className="doppel-inner p-5 sm:p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="product-chrome w-full sm:w-[220px] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/product/meet-extension.svg"
                alt="Google Meet caption capture"
                width={440}
                height={280}
                className="block w-full h-auto"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[16px] font-semibold tracking-tight text-zinc-900 mb-1">
                New: Chrome extension for Google Meet
              </h3>
              <p className="text-[13px] text-zinc-600 mb-4">
                Captures live captions automatically. Your call appears in the
                dashboard seconds after the meeting ends — no upload, no
                post-call work.
              </p>
              <a
                href="/extension"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#F26522] text-white text-[12px] font-semibold hover:bg-[#e05a1a] transition shrink-0"
              >
                Get the extension →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY MOBILE CTA — bottom bar, hidden on lg+. Always-visible
          conversion touchpoint. Reuses the existing HeroCTA island (it
          already handles signed-in vs signed-out state). */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <HeroCTA />
      </div>

      <div className="hidden lg:block">
        <StickyMarketingCta label="Start with 300 free minutes/mo" href="/sign-up" cta="Start free" />
      </div>
    </main>
    </>
  );
}
