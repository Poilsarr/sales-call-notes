/**
 * ProductVisualCard — photo-real coded mock (GAUGE-REDESIGN Part 1, E2).
 *
 * Server component, display only: no client JS, no `gauge:scrub`
 * listeners, no `id="demo"`. The top visual is a hand-coded product
 * mock (no binaries) built from the same tokens as the live surfaces:
 * speaker pills copied from `scrub-summary-section.tsx` SPEAKER_STYLES
 * (Customer #131316 / Gauge #F26522 / Slack #047857) and the confidence
 * progressbar a11y copied from `live-proof-strip.tsx:173-185`.
 */

export type ProductVisualVariant = "transcript" | "slack" | "crm";

export interface ProductVisualCardProps {
  eyebrow: string;
  title: string;
  body: string;
  footer: string;
  variant: ProductVisualVariant;
  confidence?: number;
  /** Display data — import-free literals matching live-proof TABS. */
  callName?: string;
  speaker?: string;
  timestamp?: string;
  rival?: string;
  quote?: string;
  slackChannel?: string;
}

const ACCENT = "#F26522";

interface SignalDefaults {
  callName: string;
  speaker: string;
  timestamp: string;
  rival: string;
  quote: string;
  slackChannel: string;
  confidence: number;
}

/**
 * Per-variant defaults — verbatim live-proof TABS literals so the card
 * renders a faithful mock even when only the six core props are passed.
 * The section below overrides the slack card with the Vandelay/Otter.ai
 * set and the crm card with the Stark/Fireflies.ai set.
 */
const VARIANT_DEFAULTS: Record<ProductVisualVariant, SignalDefaults> = {
  transcript: {
    callName: "Acme Corp · Discovery",
    speaker: "Sarah Chen",
    timestamp: "00:14:22",
    rival: "Gong",
    quote: "We're also evaluating Gong and Chorus for the rollout.",
    slackChannel: "#deal-room-acme",
    confidence: 0.96,
  },
  slack: {
    callName: "Acme Corp · Discovery",
    speaker: "Sarah Chen",
    timestamp: "00:14:22",
    rival: "Gong",
    quote: "We're also evaluating Gong and Chorus for the rollout.",
    slackChannel: "#deal-room-acme",
    confidence: 0.96,
  },
  crm: {
    callName: "Stark Industries · Closing",
    speaker: "Marcus Lee",
    timestamp: "09:03:51",
    rival: "Fireflies.ai",
    quote:
      "Fireflies is cheaper but your competitive-intel alerts are the deciding factor.",
    slackChannel: "#deal-room-stark",
    confidence: 0.99,
  },
};

const SPEAKER_PILLS = [
  { label: "Customer", backgroundColor: "#131316" },
  { label: "Gauge", backgroundColor: ACCENT },
  { label: "Slack", backgroundColor: "#047857" },
] as const;

const ACTION_ITEMS = [
  { label: "Send procurement one-pager", due: "THU" },
  { label: "Loop in procurement lead", due: "FRI" },
  { label: "Schedule Q3 vendor review", due: "NEXT" },
] as const;

function TranscriptMock({ signal }: { signal: SignalDefaults }) {
  return (
    <div className="bg-film-cream p-5">
      <div className="flex items-center gap-2 mb-4">
        <div
          aria-hidden
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: ACCENT }}
        />
        <span className="text-[10px] font-mono tracking-wider text-gray-600 font-medium uppercase">
          Live summary
        </span>
        <span className="ml-auto text-[9px] font-mono text-gray-500">
          {signal.callName}
        </span>
      </div>

      <blockquote className="text-[13px] text-gray-700 leading-snug border-l-2 border-film-ink pl-3 mb-3">
        &ldquo;{signal.quote}&rdquo;
      </blockquote>
      <p className="text-[11.5px] text-gray-600 mb-4">
        <span
          className="shrink-0 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full leading-none"
          style={{ backgroundColor: "#131316", color: "#fff" }}
        >
          {signal.speaker}
        </span>{" "}
        <span className="text-[10px] font-mono text-gray-500">
          · {signal.timestamp}
        </span>
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4" aria-label="Speakers">
        {SPEAKER_PILLS.map((pill) => (
          <span
            key={pill.label}
            className="shrink-0 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full leading-none"
            style={{ backgroundColor: pill.backgroundColor, color: "#fff" }}
          >
            {pill.label}
          </span>
        ))}
      </div>

      <div className="pt-3 border-t border-film-ink/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
            Action items
          </span>
          <span className="text-[10px] font-mono text-gray-500">3 found</span>
        </div>
        <ul className="space-y-1.5">
          {ACTION_ITEMS.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 text-[11.5px] text-gray-700"
            >
              <span
                aria-hidden
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: ACCENT }}
              />
              <span className="flex-1">{item.label}</span>
              <span className="text-[9px] font-mono text-gray-500">
                {item.due}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 pt-3 border-t border-film-ink/10 flex items-center justify-between text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Health 8.2
        </span>
        <span className="flex items-center gap-1.5">
          Rival: {signal.rival}
        </span>
        <span className="flex items-center gap-1.5">{signal.slackChannel}</span>
      </div>
    </div>
  );
}

function SlackMock({ signal }: { signal: SignalDefaults }) {
  const pct = Math.round(signal.confidence * 100);
  return (
    <div className="bg-film-cream p-5">
      <div className="flex items-center gap-2 mb-4">
        <div
          aria-hidden
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: ACCENT }}
        />
        <span className="text-[10px] font-mono tracking-wider text-gray-600 font-medium uppercase">
          Rival signal
        </span>
        <span className="ml-auto text-[9px] font-mono text-gray-500">
          {signal.callName}
        </span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium text-gray-900">
          Rival: {signal.rival}
        </span>
        <span className="text-[10px] font-mono text-gray-500">
          {signal.confidence.toFixed(2)}
        </span>
      </div>
      <div
        className="h-2 rounded-full bg-gray-200 overflow-hidden mb-4"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${signal.rival} confidence`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: ACCENT }}
        />
      </div>

      <blockquote className="text-[13px] text-gray-700 leading-snug border-l-2 border-film-ink pl-3 mb-3">
        &ldquo;{signal.quote}&rdquo;
      </blockquote>
      <p className="text-[11.5px] text-gray-600 mb-4">
        <span
          className="shrink-0 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full leading-none"
          style={{ backgroundColor: ACCENT, color: "#fff" }}
        >
          {signal.speaker}
        </span>{" "}
        <span className="text-[10px] font-mono text-gray-500">
          · {signal.timestamp}
        </span>
      </p>

      <div className="mb-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-film-ink px-3 py-1 text-[11px] font-medium text-gray-900 bg-white">
          {signal.slackChannel}
        </span>
      </div>

      <div className="mt-4 pt-3 border-t border-film-ink/10 flex items-center justify-between text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Health 8.2
        </span>
        <span className="flex items-center gap-1.5">
          Rival: {signal.rival}
        </span>
      </div>
    </div>
  );
}

function CrmMock({ signal }: { signal: SignalDefaults }) {
  const fields = [
    { label: "Deal", value: signal.callName },
    { label: "Owner", value: signal.speaker },
    { label: "Close date", value: "2026-10-14" },
    { label: "Next step", value: "Send competitive one-pager · THU" },
  ];
  return (
    <div className="bg-film-cream p-5">
      <div className="flex items-center gap-2 mb-4">
        <div
          aria-hidden
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: ACCENT }}
        />
        <span className="text-[10px] font-mono tracking-wider text-gray-600 font-medium uppercase">
          CRM sync
        </span>
        <span className="ml-auto text-[9px] font-mono text-gray-500">
          HubSpot → Salesforce
        </span>
      </div>

      <dl className="rounded-xl border border-film-ink/10 bg-white divide-y divide-gray-100 mb-4">
        {fields.map((field) => (
          <div key={field.label} className="flex items-baseline gap-3 px-3 py-2">
            <dt className="shrink-0 w-20 text-[10px] font-mono uppercase tracking-wider text-gray-500">
              {field.label}
            </dt>
            <dd className="text-[12px] font-medium text-gray-900 truncate">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>

      <blockquote className="text-[12px] text-gray-600 leading-snug border-l-2 border-film-ink pl-3 mb-4">
        &ldquo;{signal.quote}&rdquo;{" "}
        <span className="text-[10px] font-mono text-gray-500">
          · {signal.speaker} {signal.timestamp}
        </span>
      </blockquote>

      <div className="pt-3 border-t border-film-ink/10 flex items-center justify-between text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Health 8.2
        </span>
        <span className="flex items-center gap-1.5">
          Rival: {signal.rival}
        </span>
        <span className="flex items-center gap-1.5">{signal.slackChannel}</span>
      </div>
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
  const signal: SignalDefaults = {
    callName: callName ?? defaults.callName,
    speaker: speaker ?? defaults.speaker,
    timestamp: timestamp ?? defaults.timestamp,
    rival: rival ?? defaults.rival,
    quote: quote ?? defaults.quote,
    slackChannel: slackChannel ?? defaults.slackChannel,
    confidence: confidence ?? defaults.confidence,
  };

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -top-3 left-1/2 -translate-x-1/2 rotate-[-2deg] w-24 h-6 bg-film-amber/60 border border-black/10 z-10"
      />
      <div className="doppel-outer border-2 border-film-ink shadow-[8px_8px_0_#131316]">
        <div className="doppel-inner bg-white p-0 overflow-hidden">
          {variant === "transcript" ? (
            <TranscriptMock signal={signal} />
          ) : variant === "slack" ? (
            <SlackMock signal={signal} />
          ) : (
            <CrmMock signal={signal} />
          )}
          <div className="p-6 border-t border-gray-100">
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-gray-500 mb-2">
              {eyebrow}
            </p>
            <p className="text-[15px] font-semibold text-gray-900 tracking-tight mb-2">
              {title}
            </p>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
              {body}
            </p>
            <p className="text-[11px] font-mono text-gray-500">{footer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductVisualCard;
