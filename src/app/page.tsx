import Link from "next/link";
import Nav from "@/components/nav";
import SiteFooter from "@/components/site-footer";
import SocialProof from "@/components/social-proof";
import RoiCalculator from "@/components/roi-calculator";
import HowItWorks from "@/components/how-it-works";
import FinalCta from "@/components/final-cta";
import { HeroCTA } from "@/components/hero-cta";
import { Crosshair, Upload, BarChart3, Shield, Check, ArrowRight } from "lucide-react";

// Server component — zero JS shipped for the static landing content.
// Only the CTA island runs client-side.
const capabilities = [
  { icon: Upload, title: "Upload or record", desc: "Drop an MP3, record in browser, or pipe from our Chrome extension. Whisper handles the rest." },
  { icon: Crosshair, title: "Track competitors", desc: "Every call is scanned for competitor names. You get a Slack ping the second Gong, Otter, or Chorus shows up in a deal." },
  { icon: BarChart3, title: "CRM-ready notes", desc: "Summary, action items, MEDDIC fields, next steps — formatted for HubSpot and Salesforce. One click to push." },
  { icon: Shield, title: "Local-first privacy", desc: "Audio never trains a third-party model. Your calls, your data, your IP. SOC2-ready by Q3." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#EFEFEF] text-gray-900 pb-20 lg:pb-0">
      {/* HERO — on tall viewports the column flex stretches the hero; on mobile
          we use natural flow so the content doesn't sit in the middle of a
          sea of empty space. */}
      <section className="relative lg:min-h-[100dvh] flex flex-col">
        <Nav />
        <div className="hidden lg:block flex-1" />
        <div className="relative z-20 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-14 sm:pb-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-end">
            {/* LEFT: headline + sub + CTAs */}
            <div>
              <p className="text-[13px] leading-[14px] text-gray-900 tracking-wide mb-5 sm:mb-8">Gauge</p>
              <h1 className="text-[clamp(1.75rem,7vw,4.2rem)] sm:text-[clamp(2.5rem,5vw,4.2rem)] font-semibold sm:font-medium leading-[1.08] tracking-[-0.03em] text-gray-900">
                Know the moment a<br className="hidden sm:block" />
                <span className="sm:hidden"> </span>competitor enters the deal.
              </h1>
              <p className="text-[15px] text-gray-500 max-w-xl mt-4 mb-8">
                Gauge turns every sales call into structured notes, action items, and a real-time
                competitive signal. Upload, record, or capture from Google Meet. $9/mo after a free forever tier.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                <HeroCTA />
                <Link href="/pricing" className="text-[13px] text-gray-600 hover:text-gray-900 font-medium underline-offset-4 hover:underline">
                  See pricing →
                </Link>
                <Link href="/demo" className="text-[13px] text-gray-600 hover:text-gray-900 font-medium underline-offset-4 hover:underline">
                  See it live →
                </Link>
              </div>
            </div>

            {/* RIGHT: product preview card — what a real call summary looks like.
                Shown on mobile too (capped to a sensible height) so visitors get
                visual product proof above the fold instead of an empty right
                column. */}
            <div className="relative lg:block">
              <div className="doppel-outer">
                <div className="doppel-inner p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#F26522] animate-pulse" />
                    <span className="text-[10px] font-mono tracking-wider text-gray-400 font-medium uppercase">Live summary</span>
                    <span className="ml-auto text-[9px] font-mono text-gray-300">Acme Corp · Discovery</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="shrink-0 text-[10px] font-mono font-medium text-[#F26522] bg-[#F26522]/[0.08] px-2 py-0.5 rounded-full leading-none mt-0.5">Priya S.</span>
                      <p className="text-[12.5px] text-gray-600 leading-snug">Pricing decision is going to come from procurement, not us. They want to consolidate vendors next quarter.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="shrink-0 text-[10px] font-mono font-medium text-[#2563eb] bg-[#2563eb]/[0.08] px-2 py-0.5 rounded-full leading-none mt-0.5">You</span>
                      <p className="text-[12.5px] text-gray-600 leading-snug">Understood. Want me to loop in your procurement lead next call, or send a one-pager for the consolidation review?</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Action items</span>
                      <span className="text-[10px] font-mono text-gray-300">3 found</span>
                    </div>
                    <ul className="space-y-1.5">
                      <li className="flex items-center gap-2 text-[11.5px] text-gray-700">
                        <span className="w-1 h-1 rounded-full bg-[#F26522]" />
                        <span className="flex-1">Send procurement one-pager</span>
                        <span className="text-[9px] font-mono text-gray-400">THU</span>
                      </li>
                      <li className="flex items-center gap-2 text-[11.5px] text-gray-700">
                        <span className="w-1 h-1 rounded-full bg-[#F26522]" />
                        <span className="flex-1">Loop in procurement lead</span>
                        <span className="text-[9px] font-mono text-gray-400">FRI</span>
                      </li>
                      <li className="flex items-center gap-2 text-[11.5px] text-gray-700">
                        <span className="w-1 h-1 rounded-full bg-[#F26522]" />
                        <span className="flex-1">Schedule Q3 vendor review</span>
                        <span className="text-[9px] font-mono text-gray-400">NEXT</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Health 8.2
                    </span>
                    <span className="flex items-center gap-1.5">
                      Sentiment positive
                    </span>
                    <span className="flex items-center gap-1.5">
                      Talk ratio 42 / 58
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28 border-t border-gray-200">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-14">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">Capabilities</p>
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

      {/* COMPETITIVE INTEL DEMO — live alert feed */}
      <section className="bg-[#0a0a0b] text-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-14">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#F26522] mb-3">
              <Crosshair size={12} /> The wedge
            </div>
            <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
              We tell you the second a competitor enters a deal.
            </h2>
            <p className="text-white/50 text-[14px]">
              Not a weekly report. Not a dashboard nobody opens. A real-time ping with the exact call,
              the speaker, and the line where it happened.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
              <div key={i} className="doppel-outer">
                <div className="doppel-inner bg-zinc-900/80 p-5 sm:p-6 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-5">
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: alert.accent }}
                    />
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-mono">
                      Live alert
                    </span>
                    <span className="ml-auto text-[10px] font-mono text-white/30">
                      {alert.age}
                    </span>
                  </div>

                  <div className="font-mono text-[12px] space-y-2.5 mb-5">
                    <div className="flex items-start gap-3">
                      <span className="text-white/30 shrink-0 w-14">{alert.time}</span>
                      <div>
                        <span className="text-white/55">{alert.speaker}: </span>
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
                        <div className="text-white/40 text-[10.5px]">
                          {alert.call} · confidence {alert.confidence}
                        </div>
                        <div className="text-white/30 text-[10.5px] mt-0.5 truncate">
                          Slack ping → {alert.slack}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-white/30 mt-6 max-w-2xl">
            Sample alerts — shown for product demo. In production,
            alerts fire in real time across all your active calls.
          </p>
        </div>
      </section>

      {/* WHO IT'S FOR (social proof — honest, no fake brand names) */}
      <SocialProof />

      {/* HOW IT WORKS — 4-step process from upload to CRM push */}
      <HowItWorks />

      {/* ROI CALCULATOR (honest math, all inputs user-controlled) */}
      <RoiCalculator />

      {/* PRICING + CTA */}
      <section className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28 border-t border-gray-200">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">Pricing</p>
              <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-4">
                Free for solo SDRs. $9/mo when you scale. No AI credit traps.
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
                  <span className="text-gray-400 text-[14px]">/month per user</span>
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
      <SiteFooter />
    </main>
  );
}