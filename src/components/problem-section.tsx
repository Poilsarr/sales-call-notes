import { EyeOff, FileText, CalendarClock } from "lucide-react";
import { HOMEPAGE_COPY } from "@/lib/homepage-copy";

/**
 * Problem section (FRONTPAGE-PITCH-PLAN §3 ≙ Uber-deck slide 2: 3 pains).
 * Granola.ai whitespace restraint: 3 quiet light cards, generous spacing, no dark wall.
 * Copy centralized in HOMEPAGE_COPY.problem; icons paired by index.
 */
const ICONS = [EyeOff, FileText, CalendarClock];

const ACCENT = "#F26522";

/**
 * Coded mini-visuals (VISUAL-DENSITY D1). Decorative only — all titles/descs
 * below stay verbatim from HOMEPAGE_COPY.problem. No binaries, no new claims:
 * every token reuses words already in the bullet copy.
 */
function MissedLineVisual() {
  return (
    <div
      data-testid="problem-visual-missed-line"
      aria-hidden
      className="bg-film-cream rounded-xl border border-film-ink/10 p-4 mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono tracking-wider text-gray-600 uppercase">
          Discovery
        </span>
        <span className="ml-auto text-[10px] font-mono text-gray-500">
          30:42
        </span>
      </div>
      <div className="rounded-lg bg-white border border-gray-100 px-3 py-2.5">
        <p className="text-[12px] text-gray-700 leading-snug">
          &ldquo;We&rsquo;re also evaluating{" "}
          <span
            data-testid="problem-redacted-bar"
            className="inline-block align-middle h-3.5 w-16 rounded bg-film-ink"
            title="redacted rival mention"
          />{" "}
          for rollout.&rdquo;
        </p>
        <p className="mt-2 text-[10px] font-mono text-gray-500">
          rival named · nobody wrote it down
        </p>
      </div>
    </div>
  );
}

function HoursDialVisual() {
  return (
    <div
      data-testid="problem-visual-hours-dial"
      aria-hidden
      className="bg-film-cream rounded-xl border border-film-ink/10 p-4 mb-5 flex items-center gap-4"
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        role="img"
        aria-label="clock dial"
        className="shrink-0"
      >
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="#fff"
          stroke="#131316"
          strokeOpacity="0.12"
          strokeWidth="2"
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          const x1 = 32 + 23 * Math.cos(a);
          const y1 = 32 + 23 * Math.sin(a);
          const x2 = 32 + 26 * Math.cos(a);
          const y2 = 32 + 26 * Math.sin(a);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#131316"
              strokeOpacity="0.25"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
        <line
          x1="32"
          y1="32"
          x2="32"
          y2="16"
          stroke={ACCENT}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="32"
          y1="32"
          x2="43"
          y2="37"
          stroke="#131316"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="32" cy="32" r="3" fill={ACCENT} />
      </svg>
      <div>
        <p className="font-mono text-[22px] leading-none font-semibold text-gray-900">
          5h
        </p>
        <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-gray-500">
          selling time · FRI
        </p>
      </div>
    </div>
  );
}

function SlippingCalendarVisual() {
  return (
    <div
      data-testid="problem-visual-slipping-calendar"
      aria-hidden
      className="bg-film-cream rounded-xl border border-film-ink/10 p-4 mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono tracking-wider text-gray-600 uppercase">
          Follow-ups
        </span>
        <span className="ml-auto text-[10px] font-mono font-medium px-2 py-0.5 rounded-full leading-none bg-[#E8442E] text-white">
          LATE
        </span>
      </div>
      <ul className="rounded-lg bg-white border border-gray-100 divide-y divide-gray-100">
        <li className="flex items-center gap-2 px-3 py-2">
          <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-[#E8442E]" />
          <span className="text-[12px] text-gray-700">one-pager</span>
          <span className="ml-auto text-[10px] font-mono text-gray-400">
            late
          </span>
        </li>
        <li className="flex items-center gap-2 px-3 py-2">
          <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-[#E8442E]" />
          <span className="text-[12px] text-gray-700">Q3 review invite</span>
          <span className="ml-auto text-[10px] font-mono text-gray-400">
            late
          </span>
        </li>
      </ul>
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
