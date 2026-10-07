import { EyeOff, FileText, CalendarClock } from "lucide-react";
import { HOMEPAGE_COPY } from "@/lib/homepage-copy";

/**
 * Problem section (FRONTPAGE-PITCH-PLAN §3 ≙ Uber-deck slide 2: 3 pains).
 * Granola.ai whitespace restraint: 3 quiet light cards, generous spacing, no dark wall.
 * Copy centralized in HOMEPAGE_COPY.problem; icons paired by index.
 */
const ICONS = [EyeOff, FileText, CalendarClock];

/**
 * Quiet text visuals — calm mono stamps only (no coded mocks).
 * Decorative; all titles/descs below stay verbatim from
 * HOMEPAGE_COPY.problem. Testids preserved for analytics pins.
 */
function MissedLineVisual() {
  return (
    <div
      data-testid="problem-visual-missed-line"
      aria-hidden
      className="rounded-xl border border-black/[0.06] bg-white p-4 mb-5"
    >
      <p className="text-[11px] font-mono text-gray-500">
        30:42 · rival named
      </p>
    </div>
  );
}

function HoursDialVisual() {
  return (
    <div
      data-testid="problem-visual-hours-dial"
      aria-hidden
      className="rounded-xl border border-black/[0.06] bg-white p-4 mb-5"
    >
      <p className="text-[11px] font-mono text-gray-500">
        5h · selling time
      </p>
    </div>
  );
}

function SlippingCalendarVisual() {
  return (
    <div
      data-testid="problem-visual-slipping-calendar"
      aria-hidden
      className="rounded-xl border border-black/[0.06] bg-white p-4 mb-5"
    >
      <p className="text-[11px] font-mono text-gray-500">
        follow-ups · on time
      </p>
    </div>
  );
}

const VISUALS = [MissedLineVisual, HoursDialVisual, SlippingCalendarVisual];

export default function ProblemSection() {
  return (
    <section
      aria-labelledby="problem-heading"
      className="bg-white py-16 sm:py-20 lg:py-28"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-600 mb-3">
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
            const Visual = VISUALS[i];
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
                  <Visual />
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
