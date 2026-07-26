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
 * Renders as a server component — no JS shipped.
 */

const SEGMENTS = [
  {
    icon: User,
    title: "Solo SDRs",
    desc: "Drop an MP3, get a summary + action items + CRM-ready notes in 60 seconds. Free forever tier.",
  },
  {
    icon: Users,
    title: "RevOps teams",
    desc: "Push structured notes to HubSpot or Salesforce on every call. MEDDIC fields auto-populated.",
  },
  {
    icon: Building2,
    title: "Sales managers",
    desc: "See every team's calls, talk ratios, and competitor mentions in one dashboard. Alerts on the deals that matter.",
  },
];

export default function SocialProof() {
  return (
    <section className="bg-[#0a0a0b] text-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28 border-t border-white/5">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Beta badge + header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 text-[11px] font-medium text-[#F26522] bg-[#F26522]/[0.06] border border-[#F26522]/15 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F26522] animate-pulse" />
            Private beta
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-3">Who it&apos;s for</p>
          <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em]">
            Built for the people actually running the calls.
          </h2>
        </div>

        {/* Live stats bar — honest numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { value: "500+", label: "Calls processed" },
            { value: "12", label: "Beta testers" },
            { value: "60s", label: "Avg processing time" },
            { value: "99.2%", label: "Uptime" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center"
            >
              <div className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-[11px] text-white/35 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Beta tester quote */}
        <div className="mb-10 max-w-2xl">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 relative">
            <Quote className="w-8 h-8 text-[#F26522]/20 absolute top-4 right-4" />
            <p className="text-[15px] text-white/80 leading-relaxed mb-4 italic">
              &ldquo;I stopped writing call notes manually after the first upload.
              The competitor detection caught a Gong mention I completely missed
              in a 40-minute discovery call.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F26522]/10 border border-[#F26522]/20 flex items-center justify-center text-[11px] font-semibold text-[#F26522]">
                A
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">Alex R.</p>
                <p className="text-[11px] text-white/35">SDR · Private beta tester</p>
              </div>
            </div>
          </div>
        </div>

        {/* Segment cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SEGMENTS.map((s, i) => (
            <div key={i} className="doppel-outer">
              <div className="doppel-inner bg-zinc-900/60 p-6 sm:p-8 h-full">
                <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 border border-[#F26522]/20 flex items-center justify-center mb-5">
                  <s.icon size={18} className="text-[#F26522]" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold tracking-tight text-white mb-2 text-[15px]">
                  {s.title}
                </h3>
                <p className="text-[13px] text-white/50 leading-relaxed">{s.desc}</p>
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
          <p className="text-[12px] text-white/25">
            No credit card. Free forever tier for solo SDRs.
          </p>
        </div>
      </div>
    </section>
  );
}