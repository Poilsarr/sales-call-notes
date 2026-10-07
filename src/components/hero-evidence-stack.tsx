/**
 * HeroEvidenceStack — deal-evidence showcase (zero video bytes).
 *
 * GAUGE-MASTERPIECE: product stills replace CSS mock strips. Captions and
 * section chrome stay honest (≤8-word captions, no new claims). Server
 * component — no client JS.
 */

import { PRODUCT_STILLS } from "@/lib/demo-call-fiction";

const ACCENT = "#F26522";

const EVIDENCE_CARDS = [
  {
    step: "01 · Transcript proof",
    caption: "The exact line, with speaker and timestamp",
    still: PRODUCT_STILLS.transcript,
    testId: "evidence-visual-transcript",
    alt: "Transcript proof with rival highlight",
  },
  {
    step: "02 · Slack ping",
    caption: "Competitor detected: Gong (0.96)",
    still: PRODUCT_STILLS.slack,
    testId: "evidence-visual-slack",
    alt: "Slack competitor ping with quote",
  },
  {
    step: "03 · CRM sync",
    caption: "1-click HubSpot → Salesforce",
    still: PRODUCT_STILLS.crm,
    testId: "evidence-visual-crm",
    alt: "CRM sync fields with owners and dates",
  },
] as const;

const STILL_SIZE = { width: 640, height: 400 } as const;

export function HeroEvidenceStack() {
  return (
    <section
      data-testid="hero-evidence-stack"
      aria-labelledby="evidence-heading"
      className="section-tint-peach border-y border-black/[0.04] py-16 sm:py-20 lg:py-28"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span
              aria-hidden
              className="w-2 h-2 rounded-full"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 product-still-reveal">
          {EVIDENCE_CARDS.map((card) => (
            <div
              key={card.step}
              className="doppel-outer"
            >
              <div className="doppel-inner p-0 overflow-hidden h-full bg-white flex flex-col">
                <div
                  data-testid={card.testId}
                  className="product-chrome m-2 mb-0 flex-1"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- img keeps vitest free of next/image mocks */}
                  <img
                    src={card.still}
                    alt={card.alt}
                    width={STILL_SIZE.width}
                    height={STILL_SIZE.height}
                    className="block w-full h-auto"
                  />
                </div>
                <div className="px-5 py-4">
                  <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-gray-600 mb-1">
                    {card.step}
                  </p>
                  <p className="text-[13px] font-medium text-gray-900 tracking-tight">
                    {card.caption}
                  </p>
                </div>
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
