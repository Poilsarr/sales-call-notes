/**
 * HeroEvidenceStack — deal-evidence showcase (zero video bytes).
 *
 * FRONTPAGE-OVERHAUL Task 6: lifted out of the cramped hero right column
 * into a full-width, presentable section below the fold — transcript proof,
 * Slack ping, and CRM sync as three readable cards under a proper `h2`
 * (screen-reader heading nav lands here). Server component, no client JS.
 * Animation is transform/opacity only via existing fadeUp keyframes.
 */

import { FileText, MessageSquare, Database } from "lucide-react";

const ACCENT = "#F26522";

const EVIDENCE_CARDS = [
  {
    icon: FileText,
    step: "01 · Transcript proof",
    title: "The exact line, with speaker and timestamp",
    body: "Sarah Chen · 00:14:22 — “We're also evaluating Gong and Chorus for the rollout.” Rival names highlighted the second they drop.",
  },
  {
    icon: MessageSquare,
    step: "02 · Slack ping",
    title: "#deal-room-acme · Competitor detected: Gong (0.96)",
    body: "Exact quote + speaker + call link — Discovery 00:14:22. The whole deal room sees it before the call ends.",
  },
  {
    icon: Database,
    step: "03 · CRM sync",
    title: "1-click HubSpot → Salesforce",
    body: "Summary, owners, due dates, and the follow-up draft land in your CRM. Deal health 8.2, rival tracked call-over-call.",
  },
];

export function HeroEvidenceStack() {
  return (
    <section
      data-testid="hero-evidence-stack"
      aria-labelledby="evidence-heading"
      className="bg-film-cream border-y border-film-ink/10 py-16 sm:py-20 lg:py-28"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span
              aria-hidden
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: ACCENT }}
            />
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-gray-600">
              Live evidence · from call 00:14:22 · conf 0.96
            </p>
          </div>
          <h2
            id="evidence-heading"
            className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3"
          >
            Every signal ships with proof.
          </h2>
          <p className="text-gray-700 text-[14px]">
            Your virtual competitor never says “trust me” — it shows the quote,
            the speaker, and the call link, then files it where your team works.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EVIDENCE_CARDS.map((card, i) => (
            <div
              key={card.step}
              className={`doppel-outer ${i === 1 ? "animate-stagger-2" : i === 2 ? "animate-stagger-3" : "animate-stagger-1"}`}
            >
              <div className="doppel-inner p-6 sm:p-7 h-full bg-white">
                <span
                  aria-hidden
                  className="inline-flex w-9 h-9 rounded-xl items-center justify-center mb-4"
                  style={{ color: ACCENT, backgroundColor: `${ACCENT}14` }}
                >
                  <card.icon size={17} />
                </span>
                <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-gray-600 mb-3">
                  {card.step}
                </p>
                <p className="text-[15px] font-semibold text-gray-900 tracking-tight mb-2">
                  {card.title}
                </p>
                <p className="text-[13px] text-gray-700 leading-relaxed">{card.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-mono text-gray-600">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Health 8.2
          </span>
          <span>
            Rival: <span className="text-gray-900 font-medium">Gong</span>
          </span>
          <span>1-click HubSpot → Salesforce</span>
        </div>
      </div>
    </section>
  );
}
