/**
 * ProductVisualCard — soft doppel shell + product stills (Gauge Radar).
 *
 * Server component, display only. Top plane is a still from PRODUCT_STILLS
 * inside `.product-chrome`; caption carries speaker/quote/rival proof text
 * and a slim confidence progressbar for a11y.
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
  body: string;
  footer: string;
  variant: ProductVisualVariant;
  confidence?: number;
  /** Display data — defaults from demo-call-fiction DEMO_* signals. */
  callName?: string;
  speaker?: string;
  timestamp?: string;
  rival?: string;
  quote?: string;
  slackChannel?: string;
}

const ACCENT = "#F26522";

const VARIANT_DEFAULTS: Record<ProductVisualVariant, DemoCallSignal> = {
  transcript: DEMO_ACME,
  slack: DEMO_VANDELAY,
  crm: DEMO_STARK,
};

const STILL_SIZE = { width: 640, height: 400 } as const;

function ConfidenceBar({
  rival,
  confidence,
}: {
  rival: string;
  confidence: number;
}) {
  const pct = Math.round(confidence * 100);
  return (
    <div className="mt-3 flex items-center gap-2">
      <div
        className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${rival} confidence`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: ACCENT }}
        />
      </div>
      <span className="text-[10px] font-mono text-gray-500 tabular-nums">
        {confidence.toFixed(2)}
      </span>
    </div>
  );
}

export function ProductVisualCard({
  eyebrow,
  title,
  body,
  footer,
  variant,
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
    quote: quote ?? defaults.quote,
    slackChannel: slackChannel ?? defaults.slackChannel,
    confidence: confidence ?? defaults.confidence,
  };

  const stillSrc = PRODUCT_STILLS[variant];

  return (
    <div className="doppel-outer">
      <div className="doppel-inner bg-white p-0 overflow-hidden">
        <div className="product-chrome product-still-reveal m-2 mb-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- img keeps vitest free of next/image mocks */}
          <img
            src={stillSrc}
            alt={title}
            width={STILL_SIZE.width}
            height={STILL_SIZE.height}
            className="block w-full h-auto"
          />
        </div>

        <div className="p-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-gray-500 mb-2">
            {eyebrow}
          </p>
          <p className="text-[15px] font-semibold text-gray-900 tracking-tight mb-2">
            {title}
          </p>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {body}
          </p>
          <p className="text-[12px] text-gray-500 leading-snug mb-3">
            {signal.speaker} · {signal.timestamp} — &ldquo;{signal.quote}&rdquo;
            {" "}
            Rival: {signal.rival}. {signal.slackChannel}.
          </p>
          <p className="text-[11px] font-mono text-gray-500">{footer}</p>
          <ConfidenceBar rival={signal.rival} confidence={signal.confidence} />
        </div>
      </div>
    </div>
  );
}

export default ProductVisualCard;
