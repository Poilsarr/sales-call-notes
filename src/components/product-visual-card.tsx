/**
 * ProductVisualCard — obsidian proof card (Batch A port of
 * studio-artboards/fa-proof-v2). The still does the talking; the caption is
 * a compact proof ledger (speaker · timestamp · rival token · channel ·
 * confidence meter), not a paragraph. Keeps the .doppel-outer +
 * .product-chrome contract and the aria progressbar for a11y pins.
 *
 * Server component, display only. Card data from demo-call-fiction
 * DEMO_ACME / DEMO_VANDELAY / DEMO_STARK. Also used by /vs/* pages
 * (light context) — the card is self-dark, so it works on any bg.
 */

import {
  DEMO_ACME,
  DEMO_STARK,
  DEMO_VANDELAY,
  PRODUCT_STILLS,
  type DemoCallSignal,
} from "@/lib/demo-call-fiction";

export type ProductVisualVariant = "transcript" | "slack" | "crm";

export interface ProductVisualCardProps {
  eyebrow: string;
  title: string;
  /** Optional one-liner under the title (Batch A redesign). */
  body: string;
  footer: string;
  variant: ProductVisualVariant;
  /** Renders the mono SAMPLE tag when the section is a mock. */
  sample?: boolean;
  confidence?: number;
  /** Display data — defaults from demo-call-fiction DEMO_* signals. */
  callName?: string;
  speaker?: string;
  timestamp?: string;
  rival?: string;
  quote?: string;
  slackChannel?: string;
}

const VARIANT_DEFAULTS: Record<ProductVisualVariant, DemoCallSignal> = {
  transcript: DEMO_ACME,
  slack: DEMO_VANDELAY,
  crm: DEMO_STARK,
};

const SWEEP_MOD = {
  transcript: "fgv-sweep--t",
  slack: "fgv-sweep--s",
  crm: "fgv-sweep--c",
} as const;

const STILL_SIZE = { width: 640, height: 400 } as const;

function ConfidenceMeter({
  rival,
  confidence,
}: {
  rival: string;
  confidence: number;
}) {
  const pct = Math.round(confidence * 100);
  return (
    <span className="fpb-conf">
      <span
        className="fpb-confbar"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${pct}%`}
        aria-label={`${rival} confidence`}
      >
        <span
          className="fpb-conffill"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="fpb-confval tabular-nums">
        {confidence.toFixed(2)}
      </span>
    </span>
  );
}

export function ProductVisualCard({
  eyebrow,
  title,
  body,
  footer,
  variant,
  sample,
  confidence,
  callName,
  speaker,
  timestamp,
  rival,
  quote,
  slackChannel,
}: ProductVisualCardProps) {
  const defaults = VARIANT_DEFAULTS[variant];
  const signal: DemoCallSignal = {
    callName: callName ?? defaults.callName,
    speaker: speaker ?? defaults.speaker,
    timestamp: timestamp ?? defaults.timestamp,
    rival: rival ?? defaults.rival,
    // The quote is rendered inside the still artwork — data stays intact.
    quote: quote ?? defaults.quote,
    slackChannel: slackChannel ?? defaults.slackChannel,
    confidence: confidence ?? defaults.confidence,
  };

  const stillSrc = PRODUCT_STILLS[variant];

  return (
    <div className="fpb-cardwrap doppel-outer transition-all duration-300 hover:-translate-y-1">
      <div className="fpb-card">
        <div className="fpb-meta">
          <p className="fpb-eyebrow">{eyebrow}</p>
          {sample && <span className="fpb-tag">SAMPLE</span>}
        </div>

        <div className="product-chrome product-still-reveal">
          {/* eslint-disable-next-line @next/next/no-img-element -- img keeps vitest free of next/image mocks */}
          <img
            src={stillSrc}
            alt={`Demo still — ${signal.rival} named on the ${variant} view (${signal.timestamp})`}
            width={STILL_SIZE.width}
            height={STILL_SIZE.height}
            className="block w-full h-auto"
          />
          <span
            className={`fgv-sweep ${SWEEP_MOD[variant]}`}
            aria-hidden="true"
          />
        </div>

        <div className="fpb-ledger">
          <div className="fpb-lrow">
            <span className="fpb-tok"><b />{signal.speaker}</span>
            <span className="fpb-tok fpb-tok--dim">{signal.timestamp}</span>
            <ConfidenceMeter
              rival={signal.rival}
              confidence={signal.confidence}
            />
          </div>
          <div className="fpb-lrow">
            <span className="fpb-tok fpb-tok--hot"><b />{signal.rival}</span>
            <span className="fpb-tok">{signal.slackChannel}</span>
          </div>
        </div>

        <div className="fpb-line" />

        <h3 className="sr-only">{title}</h3>
        <p className="sr-only">{body}</p>
        <p className="fpb-src"><i /><span>{footer}</span></p>
      </div>
    </div>
  );
}

export default ProductVisualCard;
