import { EyeOff, FileText, CalendarClock } from "lucide-react";
import { HOMEPAGE_COPY } from "@/lib/homepage-copy";

/**
 * Problem section (FRONTPAGE-PITCH-PLAN §3 ≙ Uber-deck slide 2: 3 pains).
 * Granola.ai whitespace restraint: 3 quiet light cards, generous spacing, no dark wall.
 * Copy centralized in HOMEPAGE_COPY.problem; icons paired by index.
 */
const ICONS = [EyeOff, FileText, CalendarClock];

export default function ProblemSection() {
  return (
    <section
      aria-labelledby="problem-heading"
      className="bg-white pt-16 sm:pt-20 pb-16 sm:pb-20"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">
            {HOMEPAGE_COPY.problem.eyebrow}
          </p>
          <h2
            id="problem-heading"
            className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900"
          >
            {HOMEPAGE_COPY.problem.title}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HOMEPAGE_COPY.problem.bullets.map((bullet, i) => {
            const Icon = ICONS[i];
            return (
              <div key={bullet.title} className="doppel-outer">
                <div className="doppel-inner p-6 sm:p-8 h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                    <Icon
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="font-semibold tracking-tight text-gray-900 mb-2 text-[15px]">
                    {bullet.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    {bullet.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
