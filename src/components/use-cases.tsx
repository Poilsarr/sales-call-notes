import { Compass, FileText, History, GraduationCap } from "lucide-react";

// Granola restraint: short prose, generous whitespace, one line each.
// Otter use-case tabs, condensed to 4 scannable AE-relevant cards.
const CASES = [
  {
    icon: Compass,
    title: "Discovery",
    body: "Catch every rival name early — exact quote + speaker, before it becomes an objection.",
  },
  {
    icon: FileText,
    title: "Procurement review",
    body: "Send the one-pager on time — owners, dates, and decisions pulled from the call.",
  },
  {
    icon: History,
    title: "Q3 vendor review",
    body: "Walk in with history — every mention, commitment, and follow-up, not guesses.",
  },
  {
    icon: GraduationCap,
    title: "Coaching",
    body: "Talk time + sentiment per rep — see who listens, who pitches, who closes.",
  },
];

/**
 * UseCases — 4 AE-relevant moments (light section).
 *
 * Repurposes SocialProof segments +1 AE card. Pairs against dark
 * Differentiators to keep backgrounds alternating (no dark tunnel).
 *
 * Server component — no JS shipped.
 */
export default function UseCases() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-28 border-t border-gray-100">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">
            Where it pays off
          </p>
          <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3">
            Four calls you already have. Now they work harder.
          </h2>
          <p className="text-gray-500 text-[14px]">
            Pick your moment — Gauge turns it into notes, next steps, and
            signal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CASES.map((c) => (
            <div key={c.title} className="doppel-outer h-full">
              <div className="doppel-inner p-6 h-full flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                  <c.icon
                    size={18}
                    className="text-[#F26522]"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-semibold tracking-tight text-gray-900 mb-2 text-[15px]">
                  {c.title}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {c.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
