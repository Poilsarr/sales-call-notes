import { Compass, FileText, History, GraduationCap } from "lucide-react";

// Granola restraint: short prose, generous whitespace, one line each.
// Otter use-case tabs, condensed to 4 scannable AE-relevant cards.
//
// VISUAL-DENSITY (D2): each card gets a hand-coded mini visual above the
// title/desc (no binaries, no new claims — visuals only restate the card
// copy). Titles/bodies below are VERBATIM.
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

function DiscoveryVisual() {
  return (
    <div
      data-testid="usecase-discovery-visual"
      className="rounded-xl border border-black/[0.06] bg-[#FAFAF8] p-3 mb-5"
    >
      <p className="text-[9px] font-mono uppercase tracking-wider text-gray-500 mb-2">
        Rival signal
      </p>
      <blockquote className="text-[12px] text-gray-800 leading-snug border-l-2 border-[#F26522] pl-2 mb-2">
        &ldquo;We&rsquo;re also evaluating Gong for the rollout.&rdquo;
      </blockquote>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full leading-none bg-[#131316] text-white">
          Rival: Gong
        </span>
        <span className="text-[9px] font-mono text-gray-500">
          Sarah · 12:04
        </span>
      </div>
    </div>
  );
}

function ProcurementVisual() {
  return (
    <div
      data-testid="usecase-procurement-visual"
      className="rounded-xl border border-black/[0.06] bg-[#FAFAF8] p-3 mb-5"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-mono uppercase tracking-wider text-gray-500">
          One-pager
        </p>
        <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full leading-none bg-emerald-700 text-white">
          THU
        </span>
      </div>
      <div className="rounded-lg border border-black/[0.06] bg-white px-2.5 py-2">
        <div className="h-1.5 rounded-full bg-gray-900/80 w-2/3 mb-1.5" />
        <div className="h-1.5 rounded-full bg-gray-200 w-full mb-1.5" />
        <div className="h-1.5 rounded-full bg-gray-200 w-5/6 mb-2" />
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-gray-500">Owner</span>
          <span className="text-[9px] font-mono font-medium text-gray-900">
            Sarah Chen
          </span>
          <span className="text-[9px] font-mono text-gray-500 ml-auto">
            Due THU
          </span>
        </div>
      </div>
    </div>
  );
}

function ReviewVisual() {
  const points = [
    { dot: "bg-[#F26522]", label: "Mention" },
    { dot: "bg-[#131316]", label: "Commit" },
    { dot: "bg-emerald-600", label: "Follow-up" },
  ];
  return (
    <div
      data-testid="usecase-review-visual"
      className="rounded-xl border border-black/[0.06] bg-[#FAFAF8] p-3 mb-5"
    >
      <p className="text-[9px] font-mono uppercase tracking-wider text-gray-500 mb-2">
        Deal history
      </p>
      <div className="flex items-center" aria-hidden>
        {points.map((p, i) => (
          <div key={p.label} className="flex items-center flex-1 last:flex-none">
            <span className={`w-2 h-2 rounded-full shrink-0 ${p.dot}`} />
            {i < points.length - 1 && (
              <span className="flex-1 h-px bg-gray-300 mx-1" />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center mt-1.5">
        {points.map((p) => (
          <span
            key={p.label}
            className="flex-1 last:flex-none text-[9px] font-mono text-gray-600"
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function CoachingVisual() {
  const bars = [
    { label: "Rep", pct: 62, bar: "bg-[#F26522]" },
    { label: "Buyer", pct: 38, bar: "bg-gray-300" },
  ];
  return (
    <div
      data-testid="usecase-coaching-visual"
      className="rounded-xl border border-black/[0.06] bg-[#FAFAF8] p-3 mb-5"
    >
      <p className="text-[9px] font-mono uppercase tracking-wider text-gray-500 mb-2">
        Talk ratio
      </p>
      {bars.map((b) => (
        <div key={b.label} className="mb-1.5 last:mb-0">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] font-medium text-gray-900">
              {b.label}
            </span>
            <span className="text-[9px] font-mono text-gray-500">
              {b.pct}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full bg-gray-200 overflow-hidden"
            role="progressbar"
            aria-valuenow={b.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${b.label} talk time`}
          >
            <div
              className={`h-full rounded-full ${b.bar}`}
              style={{ width: `${b.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const VISUALS: Record<string, () => React.JSX.Element> = {
  Discovery: DiscoveryVisual,
  "Procurement review": ProcurementVisual,
  "Q3 vendor review": ReviewVisual,
  Coaching: CoachingVisual,
};

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
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-600 mb-3">
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
          {CASES.map((c) => {
            const Visual = VISUALS[c.title];
            return (
              <div key={c.title} className="doppel-outer h-full">
                <div className="doppel-inner p-6 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                    <c.icon
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  </div>
                  {Visual ? <Visual /> : null}
                  <h3 className="font-semibold tracking-tight text-gray-900 mb-2 text-[15px]">
                    {c.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    {c.body}
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
