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
      className="rounded-2xl border border-black/[0.06] bg-white p-4 mb-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-[#F26522] border border-[#F26522]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F26522] animate-pulse" />
          30:42 · rival named
        </span>
        <span className="text-[10px] font-mono text-neutral-400">Audio 42:15</span>
      </div>
      {/* CSS Audio Waveform Visual */}
      <div className="h-8 flex items-center gap-1 px-1 bg-white rounded-lg border border-neutral-100 mb-2.5">
        {[40, 60, 30, 80, 50, 95, 70, 45, 90, 100, 85, 40, 25, 70, 90, 60, 30, 85, 65, 45, 95, 80, 35, 55].map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all ${
              i >= 9 && i <= 12
                ? "bg-[#F26522] ring-1 ring-[#F26522]/40"
                : "bg-neutral-200"
            }`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="text-[11px] text-neutral-500 font-sans italic truncate">
        &ldquo;...we&apos;re currently deciding between you and Gong...&rdquo;
      </div>
    </div>
  );
}

function HoursDialVisual() {
  return (
    <div
      data-testid="problem-visual-hours-dial"
      aria-hidden
      className="rounded-2xl border border-black/[0.06] bg-white p-4 mb-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/50">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          5h · selling time
        </span>
        <span className="text-[10px] font-mono text-neutral-400">Lost / week</span>
      </div>
      {/* CSS Time Breakdown Bar */}
      <div className="space-y-1.5 mb-2">
        <div className="flex justify-between text-[10px] font-mono text-neutral-600">
          <span>Manual CRM Data Entry</span>
          <span className="font-semibold text-rose-600">5 hrs/rep</span>
        </div>
        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden flex">
          <div className="bg-rose-500 w-[65%] rounded-full" />
          <div className="bg-orange-400 w-[20%]" />
          <div className="bg-neutral-200 flex-1" />
        </div>
      </div>
      <div className="text-[11px] text-neutral-500 font-sans truncate">
        Re-typing notes on Friday instead of closing pipeline
      </div>
    </div>
  );
}

function SlippingCalendarVisual() {
  return (
    <div
      data-testid="problem-visual-slipping-calendar"
      aria-hidden
      className="rounded-2xl border border-black/[0.06] bg-white p-4 mb-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          follow-ups · on time
        </span>
        <span className="text-[10px] font-mono text-neutral-400">3d delay</span>
      </div>
      {/* Pipeline Follow-up Tracker */}
      <div className="flex items-center justify-between gap-1 bg-white p-2 rounded-lg border border-neutral-100 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium text-neutral-700">Call Ended</span>
        </div>
        <span className="text-[10px] text-neutral-300">→</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          <span className="text-[10px] font-medium text-rose-600">Recap Pending</span>
        </div>
        <span className="text-[10px] text-neutral-300">→</span>
        <div className="flex items-center gap-1.5 opacity-50">
          <span className="w-2 h-2 rounded-full bg-neutral-300" />
          <span className="text-[10px] text-neutral-500">Proposal</span>
        </div>
      </div>
      <div className="text-[11px] text-neutral-500 font-sans truncate">
        Buyer memory fades 40% every 24h without recap
      </div>
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
            className="text-[clamp(1.75rem,4vw,2.85rem)] font-film leading-[1.1] tracking-normal text-gray-900"
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
