/**
 * ProductVisualsSection — soft doppel + product stills (Gauge Radar).
 *
 * Three ProductVisualCards (transcript / slack / crm) on a soft tint
 * band. Card data from demo-call-fiction DEMO_ACME / DEMO_VANDELAY /
 * DEMO_STARK. Server component, display only.
 */

import {
  DEMO_ACME,
  DEMO_STARK,
  DEMO_VANDELAY,
} from "@/lib/demo-call-fiction";
import { ProductVisualCard } from "./product-visual-card";

export function ProductVisualsSection() {
  return (
    <section
      data-track-section="product-visuals"
      aria-labelledby="product-visuals-heading"
      className="section-tint-peach border-y border-black/[0.04] py-16 sm:py-20 lg:py-28"
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

        <div className="product-still-reveal grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <ProductVisualCard
            variant="transcript"
            eyebrow="01 · Transcript proof"
            title="The exact line, with speaker and timestamp"
            body={`${DEMO_ACME.speaker} · ${DEMO_ACME.timestamp} — “${DEMO_ACME.quote}” Rival names highlighted the second they drop.`}
            footer={`${DEMO_ACME.callName} · conf ${DEMO_ACME.confidence}`}
            confidence={DEMO_ACME.confidence}
            callName={DEMO_ACME.callName}
            speaker={DEMO_ACME.speaker}
            timestamp={DEMO_ACME.timestamp}
            rival={DEMO_ACME.rival}
            quote={DEMO_ACME.quote}
            slackChannel={DEMO_ACME.slackChannel}
          />
          <ProductVisualCard
            variant="slack"
            eyebrow="02 · Slack ping"
            title={`${DEMO_VANDELAY.slackChannel} · Competitor detected: ${DEMO_VANDELAY.rival} (${DEMO_VANDELAY.confidence})`}
            body={`${DEMO_VANDELAY.speaker} · ${DEMO_VANDELAY.timestamp} — “${DEMO_VANDELAY.quote}” Exact quote, speaker, and call link land in the deal room mid-call.`}
            footer={`${DEMO_VANDELAY.callName} · conf ${DEMO_VANDELAY.confidence}`}
            confidence={DEMO_VANDELAY.confidence}
            callName={DEMO_VANDELAY.callName}
            speaker={DEMO_VANDELAY.speaker}
            timestamp={DEMO_VANDELAY.timestamp}
            rival={DEMO_VANDELAY.rival}
            quote={DEMO_VANDELAY.quote}
            slackChannel={DEMO_VANDELAY.slackChannel}
          />
          <ProductVisualCard
            variant="crm"
            eyebrow="03 · CRM sync"
            title="1-click HubSpot → Salesforce"
            body={`${DEMO_STARK.speaker} · ${DEMO_STARK.timestamp} — summary, owners, due dates, and the follow-up draft land in your CRM. Deal health 8.2, rival tracked call-over-call.`}
            footer={`${DEMO_STARK.callName} · conf ${DEMO_STARK.confidence}`}
            confidence={DEMO_STARK.confidence}
            callName={DEMO_STARK.callName}
            speaker={DEMO_STARK.speaker}
            timestamp={DEMO_STARK.timestamp}
            rival={DEMO_STARK.rival}
            quote={DEMO_STARK.quote}
            slackChannel={DEMO_STARK.slackChannel}
          />
        </div>
      </div>
    </section>
  );
}

export default ProductVisualsSection;
