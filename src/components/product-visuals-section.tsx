/**
 * ProductVisualsSection — obsidian proof band (Batch A port of
 * studio-artboards/fa-proof-v2). Three proof cards where the rendered
 * still carries the story and the caption collapses into a mono proof
 * ledger. Copy truth: eyebrow strings, H2, footers and the demo dataset
 * stay verbatim (pinned by product-visuals.test.tsx).
 *
 * Server component, display only.
 */

import {
  DEMO_ACME,
  DEMO_STARK,
  DEMO_VANDELAY,
} from "@/lib/demo-call-fiction";
import { LiveDiv } from "./extension-live";
import { ProductVisualCard } from "./product-visual-card";

export function ProductVisualsSection() {
  return (
    <section
      data-track-section="product-visuals"
      aria-labelledby="product-visuals-heading"
      className="fpb-band py-16 sm:py-20 lg:py-28"
    >
      <div
        className="fpb-grain"
        aria-hidden="true"
      />
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 relative">
        <div className="text-center mb-12">
          <p className="fpb-eyebrow mb-4">
            Product in action
          </p>
          <h2
            id="product-visuals-heading"
            className="text-[clamp(1.6rem,4vw,3.1rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white mb-4"
          >
            Every signal ships with proof —&nbsp;
            <span className="text-[#7d818c]">see it.</span>
          </h2>
          <p className="fpb-sub">
            The line. The ping. The write-back.
          </p>
        </div>

        <LiveDiv className="product-still-reveal grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          <ProductVisualCard
            variant="transcript"
            eyebrow="01 · Transcript proof"
            title="The exact line."
            body="Speaker, timestamp, rival highlight — captured as heard."
            footer={`${DEMO_ACME.callName} · conf ${DEMO_ACME.confidence}`}
            confidence={DEMO_ACME.confidence}
            callName={DEMO_ACME.callName}
            speaker={DEMO_ACME.speaker}
            timestamp={DEMO_ACME.timestamp}
            rival={DEMO_ACME.rival}
            quote={DEMO_ACME.quote}
            slackChannel={DEMO_ACME.slackChannel}
            sample
          />
          <ProductVisualCard
            variant="slack"
            eyebrow="02 · Slack ping"
            title="Mid-call ping."
            body="Quote, speaker, call link — lands in the deal room live."
            footer={`${DEMO_VANDELAY.callName} · conf ${DEMO_VANDELAY.confidence}`}
            confidence={DEMO_VANDELAY.confidence}
            callName={DEMO_VANDELAY.callName}
            speaker={DEMO_VANDELAY.speaker}
            timestamp={DEMO_VANDELAY.timestamp}
            rival={DEMO_VANDELAY.rival}
            quote={DEMO_VANDELAY.quote}
            slackChannel={DEMO_VANDELAY.slackChannel}
            sample
          />
          <ProductVisualCard
            variant="crm"
            eyebrow="03 · CRM sync"
            title="One-click write-back."
            body="Summary, owners, due dates — straight into your CRM."
            footer={`${DEMO_STARK.callName} · conf ${DEMO_STARK.confidence}`}
            confidence={DEMO_STARK.confidence}
            callName={DEMO_STARK.callName}
            speaker={DEMO_STARK.speaker}
            timestamp={DEMO_STARK.timestamp}
            rival={DEMO_STARK.rival}
            quote={DEMO_STARK.quote}
            slackChannel={DEMO_STARK.slackChannel}
            sample
          />
        </LiveDiv>
      </div>
    </section>
  );
}

export default ProductVisualsSection;
