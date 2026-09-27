/**
 * ProductVisualsSection — photo-real coded mocks (GAUGE-REDESIGN Part 1, E2).
 *
 * Three ProductVisualCards (transcript / slack / crm) on a film-cream
 * band. Card data uses import-free literals matching the live-proof
 * TABS (Acme/Gong 0.96, Vandelay/Otter.ai 0.91, Stark/Fireflies.ai 0.99).
 * Server component, display only — NOT mounted in page.tsx here (E1 owns
 * wiring); just export default + named.
 */

import { ProductVisualCard } from "./product-visual-card";

export function ProductVisualsSection() {
  return (
    <section
      data-track-section="product-visuals"
      aria-labelledby="product-visuals-heading"
      className="bg-film-cream border-y border-film-ink/10 py-16 sm:py-20 lg:py-28"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-600 mb-3">
            Product in action
          </p>
          <h2
            id="product-visuals-heading"
            className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3"
          >
            Every signal ships with proof — see it.
          </h2>
          <p className="text-gray-600 text-[14px] leading-relaxed">
            The exact line, the Slack ping, and the CRM write-back — captured
            live on real calls, with speaker, timestamp, and confidence
            attached.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <ProductVisualCard
            variant="transcript"
            eyebrow="01 · Transcript proof"
            title="The exact line, with speaker and timestamp"
            body="Sarah Chen · 00:14:22 — “We're also evaluating Gong and Chorus for the rollout.” Rival names highlighted the second they drop."
            footer="Acme Corp · Discovery · conf 0.96"
            confidence={0.96}
            callName="Acme Corp · Discovery"
            speaker="Sarah Chen"
            timestamp="00:14:22"
            rival="Gong"
            quote="We're also evaluating Gong and Chorus for the rollout."
            slackChannel="#deal-room-acme"
          />
          <ProductVisualCard
            variant="slack"
            eyebrow="02 · Slack ping"
            title="#deal-room-vandelay · Competitor detected: Otter.ai (0.91)"
            body="Priya Shah · 11:42:08 — “Our current contract with Otter expires in Q3.” Exact quote, speaker, and call link land in the deal room mid-call."
            footer="Vandelay Industries · Demo · conf 0.91"
            confidence={0.91}
            callName="Vandelay Industries · Demo"
            speaker="Priya Shah"
            timestamp="11:42:08"
            rival="Otter.ai"
            quote="Our current contract with Otter expires in Q3 — what would migration look like?"
            slackChannel="#deal-room-vandelay"
          />
          <ProductVisualCard
            variant="crm"
            eyebrow="03 · CRM sync"
            title="1-click HubSpot → Salesforce"
            body="Marcus Lee · 09:03:51 — summary, owners, due dates, and the follow-up draft land in your CRM. Deal health 8.2, rival tracked call-over-call."
            footer="Stark Industries · Closing · conf 0.99"
            confidence={0.99}
            callName="Stark Industries · Closing"
            speaker="Marcus Lee"
            timestamp="09:03:51"
            rival="Fireflies.ai"
            quote="Fireflies is cheaper but your competitive-intel alerts are the deciding factor."
            slackChannel="#deal-room-stark"
          />
        </div>
      </div>
    </section>
  );
}

export default ProductVisualsSection;
