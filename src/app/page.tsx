import Link from "next/link";
import Nav from "@/components/nav";
import SocialProof from "@/components/social-proof";
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
    <main className="min-h-screen bg-[#EFEFEF] text-gray-900">
      {/* HERO */}
      <section className="relative min-h-[100dvh] flex flex-col">
        <Nav />
        <div className="flex-1" />
        <div className="relative z-20 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pb-14 sm:pb-16 lg:pb-20">
          <p className="text-[13px] leading-[14px] text-gray-900 tracking-wide mb-5 sm:mb-8">CallNote Pro</p>
          <h1 className="text-[clamp(1.75rem,7vw,4.2rem)] sm:text-[clamp(2.5rem,5vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900">
            Know the moment a<br className="hidden sm:block" />
            <span className="sm:hidden"> </span>competitor enters the deal.
          </h1>
          <p className="text-[15px] text-gray-500 max-w-xl mt-4 mb-8">
            CallNote Pro turns every sales call into structured notes, action items, and a real-time
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
      </section>

      {/* CAPABILITIES */}
      <section className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
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

      {/* COMPETITIVE INTEL DEMO */}
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
          <div className="doppel-outer">
            <div className="doppel-inner bg-zinc-900/80 p-6 sm:p-8 md:p-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[#F26522] animate-pulse" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">Live alert</span>
              </div>
              <div className="space-y-3 font-mono text-[13px]">
                <div className="flex items-start gap-4">
                  <span className="text-white/30 shrink-0 w-16">00:14:22</span>
                  <span className="text-white/55">Prospect:</span>
                  <span className="text-white/90">&ldquo;We&rsquo;re also evaluating Gong and Chorus for the rollout.&rdquo;</span>
                </div>
                <div className="border-t border-white/10 my-4" />
                <div className="flex items-start gap-3 text-[12px]">
                  <Crosshair size={14} className="text-[#F26522] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-white font-semibold mb-1">Competitor detected: Gong</div>
                    <div className="text-white/40">Call: Acme Corp / Discovery / Sarah Chen &middot; confidence 0.96</div>
                    <div className="text-white/30 mt-1">Slack ping sent to #deal-room-acme</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR (social proof — honest, no fake brand names) */}
      <SocialProof />

      {/* PRICING + CTA */}
      <section className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
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

      {/* FOOTER */}
      <footer className="bg-[#0a0a0b] text-white/40 py-10 text-center text-[12px]">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-[#F26522] rotate-45" />
            <span className="text-white text-[13px] font-medium">CallNote Pro</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/refund" className="hover:text-white">Refund</Link>
          </div>
          <div>© {new Date().getFullYear()} CallNote Pro</div>
        </div>
      </footer>
    </main>
  );
}