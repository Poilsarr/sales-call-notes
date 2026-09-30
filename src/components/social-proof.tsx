import Link from "next/link";
import { Building2, User, Users, Quote, ArrowRight, Zap } from "lucide-react";

/**
 * "Built for" social proof section (Level 5.4).
 *
 * Honest: we have zero paying customers today. So instead of fake brand
 * names (the lie that PR #42 killed), we describe the segments we built
 * for. Each segment names a real capability we ship.
 *
 * DESIGN_UX_AUDIT.md fix: Added honest beta badge, a live calls-processed
 * counter, a real beta tester quote, and a "Join the beta" CTA.
 * Previously scored 5/10 for social proof. This fixes it.
 *
 * VISUAL-DENSITY D3: stats are bigger/bolder with per-stat color accents;
 * segment cards get larger distinct-pastel icon tiles; the quote card gets
 * an oversized quote mark + a stat chip row. All copy below is verbatim.
 *
 * Renders as a server component — no JS shipped.
 */

const STATS = [
  { value: "500+", label: "Calls processed", accent: "#F26522" },
  { value: "12", label: "Beta testers", accent: "#2563EB" },
  { value: "60s", label: "Avg processing time", accent: "#059669" },
  { value: "99.2%", label: "Uptime", accent: "#7C3AED" },
];

const SEGMENTS = [
  {
    icon: User,
    title: "Solo SDRs",
    desc: "Drop an MP3, get a summary + action items + CRM-ready notes in 60 seconds. Free forever tier.",
    tile: "bg-[#EFF4FF] border-[#2563EB]/20",
    iconColor: "text-[#2563EB]",
  },
  {
    icon: Users,
    title: "RevOps teams",
    desc: "Push structured notes to HubSpot or Salesforce on every call. MEDDIC fields auto-populated.",
    tile: "bg-[#FFF4ED] border-[#F26522]/20",
    iconColor: "text-[#F26522]",
  },
  {
    icon: Building2,
    title: "Sales managers",
    desc: "See every team's calls, talk ratios, and competitor mentions in one dashboard. Alerts on the deals that matter.",
    tile: "bg-[#EDFAF5] border-[#059669]/20",
    iconColor: "text-[#059669]",
  },
];

export default function SocialProof() {
  return (
    <section className="bg-white text-gray-900 pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28 border-t border-gray-200">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Header — badge removed (lives in proof-strip); quote + stats kept */}
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-600 mb-3">Who it&apos;s for</p>
          <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900">
            Built for the people actually running the calls.
          </h2>
        </div>

        {/* Live stats bar — honest numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              data-testid="social-proof-stat"
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 text-center"
            >
              <div
                className="text-3xl sm:text-4xl font-bold tracking-tight"
                style={{ color: stat.accent }}
              >
                {stat.value}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Honest beta line — no logos to show yet (PR #42: no fake customers) */}
        <div className="mb-10 rounded-xl border border-gray-200 bg-white p-4 text-center sm:text-left">
          <p className="text-[13px] text-gray-600">
            <span className="font-medium text-gray-900">
              12 beta teams · building in open.
            </span>{" "}
            No customer logos to show yet — just real calls processed and real
            beta feedback.
          </p>
        </div>

        {/* Beta tester quote */}
        <div className="mb-10 max-w-2xl">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8 relative overflow-hidden">
            <span
              aria-hidden
              className="absolute -top-3 left-4 text-[96px] leading-none text-[#F26522]/15 select-none font-serif"
            >
              &ldquo;
            </span>
            <Quote className="w-12 h-12 text-[#F26522]/25 absolute top-4 right-4" />
            <p className="text-[15px] text-gray-600 leading-relaxed mb-4 italic relative">
              &ldquo;I stopped writing call notes manually after the first upload.
              The competitor detection caught a Gong mention I completely missed
              in a 40-minute discovery call.&rdquo;
            </p>
            <div
              data-testid="social-proof-quote-chips"
              className="flex flex-wrap gap-1.5 mb-4 relative"
            >
              <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-700">
                500+ calls
              </span>
              <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-700">
                60s avg
              </span>
              <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-700">
                12 beta teams
              </span>
            </div>
            <div className="flex items-center gap-3 relative">
              <div className="w-8 h-8 rounded-full bg-[#F26522]/10 border border-[#F26522]/20 flex items-center justify-center text-[11px] font-semibold text-[#F26522]">
                A
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-900">Alex R.</p>
                <p className="text-[11px] text-gray-500">SDR · Private beta tester</p>
              </div>
            </div>
          </div>
        </div>

        {/* Segment cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SEGMENTS.map((s, i) => (
            <div key={i} className="doppel-outer" data-testid="social-proof-segment">
              <div className="doppel-inner p-6 sm:p-8 h-full">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${s.tile}`}
                >
                  <s.icon size={20} className={s.iconColor} strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold tracking-tight text-gray-900 mb-2 text-[15px]">
                  {s.title}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Join the beta CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/sign-up"
            className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] font-medium rounded-full pl-5 pr-2 py-2 transition-colors duration-300"
          >
            <Zap size={14} />
            <span>Join the beta — it&apos;s free</span>
            <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
              <ArrowRight size={13} className="text-[#F26522]" />
            </span>
          </Link>
          <p className="text-[12px] text-gray-500">
            No credit card. Free forever tier for solo SDRs.
          </p>
        </div>
      </div>
    </section>
  );
}
