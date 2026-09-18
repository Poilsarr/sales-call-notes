import { Crosshair, Eye, Target } from "lucide-react";

/**
 * WhoWeAre — who we are, goal, what we achieve (FRONTPAGE-OVERHAUL Task 4).
 *
 * Server component, zero JS. Honest numbers only (12 beta teams, 500+ calls)
 * — no fake logos, no invented metrics.
 */
const PILLARS = [
  {
    icon: Eye,
    title: "What we do",
    desc: "Gauge turns every sales call into structured notes, owners, and follow-ups — with a virtual competitor signal the second a rival is named.",
  },
  {
    icon: Target,
    title: "Our goal",
    desc: "No rep ever loses a deal to a competitor nobody wrote down. Every mention becomes evidence, every deal stays visible.",
  },
  {
    icon: Crosshair,
    title: "What we achieve",
    desc: "12 beta teams run 500+ calls through Gauge — summaries in under 60 seconds, Slack pings with exact quotes, one-click CRM push.",
  },
];

export function WhoWeAre() {
  return (
    <section
      data-track-section="who-we-are"
      aria-labelledby="who-we-are-heading"
      className="bg-[#F5F0E6] border-t border-gray-200 pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-600 mb-3">
            Who we are
          </p>
          <h2
            id="who-we-are-heading"
            className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3"
          >
            Reps talk. Gauge remembers everything.
          </h2>
          <p className="text-gray-700 text-[14px]">
            We are the team behind the virtual competitor signal — built for
            managers who need the truth from every call, not another dashboard
            nobody opens.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="doppel-outer">
              <div className="doppel-inner p-6 sm:p-8 h-full">
                <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                  <p.icon size={18} className="text-[#C94F17]" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="font-semibold tracking-tight text-gray-900 mb-2 text-[15px]">
                  {p.title}
                </h3>
                <p className="text-[13px] text-gray-700 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
