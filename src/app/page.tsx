import Link from "next/link";
import Nav from "@/components/nav";
import SocialProof from "@/components/social-proof";
import RoiCalculator from "@/components/roi-calculator";
import HowItWorks from "@/components/how-it-works";
import Differentiators from "@/components/differentiators";
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
import ProofStrip from "@/components/proof-strip";
import LiveProofStrip from "@/components/live-proof-strip";
import { HOMEPAGE_COPY } from "@/lib/homepage-copy";
import { Crosshair, Upload, BarChart3, Shield, Check, ArrowRight, Play } from "lucide-react";

export const metadata = {
  title: "Gauge — AI Sales Call Notes & Competitive Intelligence",
  description: "Gauge turns sales calls into structured notes, action items, and real-time competitive alerts. Upload, record, or capture from Google Meet.",
};

// Server component — zero JS shipped for the static landing content.
// Only the CTA island runs client-side.
const capabilities = [
  { icon: Upload, title: "Upload or record", desc: "Drop in an MP3, record in your browser, or capture Google Meet — no bot ever joins the call." },
  { icon: Crosshair, title: "Track competitors", desc: "Every call is scanned for competitor names. You get a Slack ping the second Gong, Otter, or Chorus shows up in a deal." },
  { icon: BarChart3, title: "CRM-ready notes", desc: "Summary, owners and due dates, and a follow-up draft — one click into HubSpot or Salesforce." },
  { icon: Shield, title: "Transparent privacy", desc: "Your calls are processed by disclosed cloud providers, never used to train our models, and covered by export and deletion controls." },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="min-h-screen bg-[#EFEFEF] text-gray-900 pb-20 lg:pb-0">
        {/* HERO — on tall viewports the column flex stretches the hero; on mobile
          we use natural flow so the content doesn't sit in the middle of a
          sea of empty space. */}
        <section className="relative lg:min-h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-b from-film-paper via-[#EFEFEF] to-[#EFEFEF]">
          {/* Film-world dressing — waveform ribbon echo + paper grain */}
          <div
            className="absolute inset-0 opacity-[0.5] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(rgba(19,19,22,0.055) 1px, transparent 1px)",
              backgroundSize: "5px 5px",
            }}
            aria-hidden
          />
          <svg
            className="absolute inset-x-0 top-[8%] w-full h-[420px] pointer-events-none"
            viewBox="0 0 1440 420"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M-20,300 C200,120 360,120 520,260 C680,400 840,400 1000,260 C1160,120 1300,140 1460,260"
              fill="none"
              stroke="#131316"
              strokeWidth="5"
              opacity="0.10"
              strokeLinecap="round"
            />
            <path
              d="M-20,330 C200,170 360,170 520,290 C680,410 840,410 1000,290 C1160,170 1300,190 1460,290"
              fill="none"
              stroke="#E8442E"
              strokeWidth="5"
              opacity="0.16"
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
                <span className="text-[#C94F17] underline decoration-[#F26522]/50 decoration-[0.08em] underline-offset-[0.12em]">
                  {HOMEPAGE_COPY.heroH1Highlight}
                </span>
                {HOMEPAGE_COPY.heroH1.split(HOMEPAGE_COPY.heroH1Highlight)[1]}
              </h1>
              <p className="text-[15px] sm:text-base text-gray-700 max-w-xl mt-4 mb-3 leading-relaxed">
                {HOMEPAGE_COPY.heroSub}
              </p>
              <div className="inline-flex items-center gap-2 text-[11px] font-mono font-medium text-film-ink bg-film-cream border-2 border-film-ink rounded-full px-3 py-1 mb-5 shadow-[3px_3px_0_#131316]">
                <span className="w-1.5 h-1.5 rounded-full bg-film-vermilion animate-pulse" />
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

      <HeroEvidenceStack />

      {/* Scrub companion moved below the fold (HOMEPAGE-V2): hero-right is
          video only; these lines scrub it via the gauge:scrub event. */}
      <ScrubSummarySection />

      {/* PROOF STRIP + PROBLEM — FRONTPAGE-PITCH-PLAN §2-3 (Uber-deck slides 2-3).
          Rendered directly below the hero; sections 5-9 below are untouched. */}
      <LiveProofStrip />
      <ProofStrip />
      <ProblemSection />

      {/* TEAM — frontal: trust right after the pitch */}
      <TeamShowcase />

      {/* CAPABILITIES */}
      <section data-track-section="capabilities" className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28 border-t border-gray-200">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-14">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-600 mb-3">Capabilities</p>
            <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3">
              Built for SDRs who lose deals to competitors they never saw coming.
            </h2>
            <p className="text-gray-500 text-[14px]">Four things. No filler.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map((c, i) => (
              <div key={i} className="doppel-outer">
                <div className="doppel-inner p-6 sm:p-8 md:p-10 h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                    <c.icon size={18} className="text-[#F26522]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold tracking-tight text-gray-900 mb-2 text-[15px]">{c.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed max-w-md">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPETITIVE INTEL DEMO — live alert feed.
          Stacked halves (HOMEPAGE-V2 shell): copy header top, film middle,
          alert cards grid bottom. Player internals owned by E2. */}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-10 lg:mt-14">
            {[
              {
                time: "00:14:22",
                call: "Acme Corp · Discovery",
                speaker: "Sarah Chen",
                quote: "We're also evaluating Gong and Chorus for the rollout.",
                detected: "Gong",
                confidence: 0.96,
                slack: "#deal-room-acme",
                age: "2 min ago",
                accent: "#F26522",
              },
              {
                time: "11:42:08",
                call: "Vandelay Industries · Demo",
                speaker: "Priya Shah",
                quote: "Our current contract with Otter expires in Q3 — what would migration look like?",
                detected: "Otter.ai",
                confidence: 0.91,
                slack: "#deal-room-vandelay",
                age: "18 min ago",
                accent: "#2563eb",
              },
              {
                time: "09:03:51",
                call: "Stark Industries · Closing",
                speaker: "Marcus Lee",
                quote: "Fireflies is cheaper but your competitive-intel alerts are the deciding factor for us.",
                detected: "Fireflies.ai",
                confidence: 0.99,
                slack: "#deal-room-stark",
                age: "1 hr ago",
                accent: "#7c3aed",
              },
            ].map((alert, i) => (
              <div key={i} className="doppel-outer-dark">
                <div className="doppel-inner-dark p-5 sm:p-6 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-5">
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: alert.accent }}
                    />
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/70 font-mono">
                      Live alert
                    </span>
                    <span className="ml-auto text-[10px] font-mono text-white/60">
                      {alert.age}
                    </span>
                  </div>

                  <div className="font-mono text-[12px] space-y-2.5 mb-5">
                    <div className="flex items-start gap-3">
                      <span className="text-white/60 shrink-0 w-14">{alert.time}</span>
                      <div>
                        <span className="text-white/85">{alert.speaker}: </span>
                        <span className="text-white/90">&ldquo;{alert.quote}&rdquo;</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 mt-auto">
                    <div className="flex items-start gap-2.5 text-[11.5px]">
                      <Crosshair
                        size={13}
                        className="mt-0.5 shrink-0"
                        style={{ color: alert.accent }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold mb-0.5">
                          Competitor detected: {alert.detected}
                        </div>
                        <div className="text-white/70 text-[10.5px]">
                          {alert.call} · confidence {alert.confidence}
                        </div>
                        <div className="text-white/60 text-[10.5px] mt-0.5 truncate">
                          Slack ping → {alert.slack}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[12px] text-white/75 mt-6 max-w-2xl">
            Sample alerts — shown for product demo. In production,
            alerts fire in real time across all your active calls.
          </p>
        </div>
      </section>

      {/* WHO IT'S FOR (social proof — honest, no fake brand names) */}
      <SocialProof />

      <WhoWeAre />

      {/* HOW IT WORKS — 4-step process from upload to CRM push */}
      <HowItWorks />

      <Differentiators />
      <UseCases />

      {/* ROI CALCULATOR (honest math, all inputs user-controlled) */}
      <RoiCalculator />

      {/* PRICING + CTA */}
      <section data-track-section="pricing" className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28 border-t border-gray-200">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-600 mb-3">Pricing</p>
              <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-4">
                Free 300 minutes a month. $9 flat when you scale — up to 5 seats, 1,200 minutes.
              </h2>
              <ul className="space-y-2 text-[14px] text-gray-600 mb-6">
                {[
                  "Unlimited uploads, 1,200 min/mo on Pro",
                  "Competitive intel + Slack alerts from day one on Pro",
                  "HubSpot + Salesforce CRM push, one click",
                  "Cancel anytime. Annual available.",
                ].map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={16} className="text-[#F26522] mt-0.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/pricing" className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 w-fit">
                  <span>See full pricing</span>
                  <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                    <ArrowRight size={14} className="text-[#F26522]" />
                  </span>
                </Link>
                <Link href="/features" className="text-[13px] text-gray-600 hover:text-gray-900 font-medium self-center underline-offset-4 hover:underline">
                  See all features →
                </Link>
              </div>
            </div>
            <div className="doppel-outer">
              <div className="doppel-inner p-6 sm:p-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-semibold tracking-tight">$9</span>
                  <span className="text-gray-600 text-[14px]">/month per user</span>
                </div>
                <p className="text-[12px] text-gray-500 mb-6">Pro plan. Yearly = $7.50/mo.</p>
                <div className="space-y-2 text-[13px]">
                  {[
                    "1,200 transcription minutes/mo",
                    "Unlimited AI summaries",
                    "HubSpot + Salesforce sync",
                    "Competitive intelligence + Slack alerts",
                    "Team workspace (up to 5)",
                    "Priority support",
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700">
                      <Check size={14} className="text-[#F26522]" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA — closing conversion touchpoint before footer */}
      <FinalCta />

      {/* CHROME EXTENSION — for users who don't want to upload/record */}
      <section className="px-5 sm:px-8 lg:px-12 py-12 sm:py-16">
        <div className="max-w-[1100px] mx-auto p-6 sm:p-8 rounded-2xl border border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="#fff" stroke="#4285F4" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="3.5" fill="#4285F4" />
              <path d="M12 8.5 L20.5 12 L12 15.5 Z" fill="#EA4335" />
              <path d="M12 8.5 L3.5 12 L12 15.5 Z" fill="#FBBC04" />
              <path d="M12 8.5 L12 1 L18 12 Z" fill="#34A853" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-semibold tracking-tight text-zinc-900 mb-1">
              New: Chrome extension for Google Meet
            </h3>
            <p className="text-[13px] text-zinc-600">
              Captures live captions automatically. Your call appears in the
              dashboard seconds after the meeting ends — no upload, no
              post-call work.
            </p>
          </div>
          <a
            href="/extension"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-700 transition shrink-0"
          >
            Get the extension →
          </a>
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
