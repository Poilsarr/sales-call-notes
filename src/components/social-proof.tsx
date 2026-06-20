import { Building2, User, Users } from "lucide-react";

/**
 * "Built for" social proof section (Level 5.4).
 *
 * Honest: we have zero paying customers today. So instead of fake brand
 * names (the lie that PR #42 killed), we describe the segments we built
 * for. Each segment names a real capability we ship.
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
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-3">Who it&apos;s for</p>
          <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em]">
            Built for the people actually running the calls.
          </h2>
        </div>
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
      </div>
    </section>
  );
}