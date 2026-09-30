/**
 * CapabilitiesBento — visual bento replacing the theoretical Capabilities cards.
 *
 * Server component, display only: no client JS, no images/video, and no demo
 * anchor id anywhere in the markup.
 * Section shell (data-track-section, container, eyebrow, H2, sub) is kept from
 * the inline `src/app/page.tsx` block it replaces; titles/bodies below are
 * VERBATIM copies of that block's strings.
 *
 * The four TOP visuals are hand-coded product mocks (no binaries) on the same
 * tokens as `product-visual-card.tsx` (bg-film-cream, Rival-signal header,
 * confidence progressbar a11y from live-proof-strip, Health 8.2 footer, CRM
 * field rows). ProductVisualCard itself is deliberately NOT reused here: it
 * bundles its own bottom copy + tape overlay + outer doppel shell, which would
 * double-nest shells and duplicate non-verbatim copy inside a bento card.
 */

import { Mic, Shield, Upload, Video } from "lucide-react";

const ACCENT = "#F26522";

const TITLES = {
  upload: "Upload or record",
  track: "Track competitors",
  crm: "CRM-ready notes",
  privacy: "Transparent privacy",
} as const;

const BODIES = {
  upload:
    "Drop in an MP3, record in your browser, or capture Google Meet — no bot ever joins the call.",
  track:
    "Every call is scanned for competitor names. You get a Slack ping the second Gong, Otter, or Chorus shows up in a deal.",
  crm: "Summary, owners and due dates, and a follow-up draft — one click into HubSpot or Salesforce.",
  privacy:
    "Your calls are processed by disclosed cloud providers, never used to train our models, and covered by export and deletion controls.",
} as const;

function CardShell({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div
      className="doppel-outer border-2 border-film-ink shadow-[8px_8px_0_#131316]"
      aria-label={label}
    >
      <div className="doppel-inner bg-white p-0 overflow-hidden">{children}</div>
    </div>
  );
}

function CardBody({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-6 border-t border-gray-100">
      <h3 className="font-semibold tracking-tight text-gray-900 mb-2 text-[15px]">
        {title}
      </h3>
      <p className="text-[13px] text-gray-600 leading-relaxed max-w-md">
        {body}
      </p>
    </div>
  );
}

function UploadVisual() {
  return (
    <div
      data-testid="capability-upload-visual"
      className="bg-film-cream p-5 min-h-[200px] flex flex-col justify-center"
    >
      <div className="rounded-xl border-2 border-dashed border-film-ink/20 bg-white p-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Upload size={14} className="text-gray-500" aria-hidden />
          <span className="text-[12px] font-medium text-gray-900">
            Drop in an MP3
          </span>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full leading-none bg-film-ink text-white">
            MP3
          </span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-film-ink text-white px-3 py-1 text-[11px] font-medium">
            <Mic size={12} aria-hidden />
            Record
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-film-ink px-3 py-1 text-[11px] font-medium text-gray-900 bg-white">
            <Video size={12} aria-hidden />
            Google Meet
          </span>
        </div>
      </div>
      <p className="text-center text-[10px] font-mono text-gray-500 mt-3">
        no bot ever joins the call
      </p>
    </div>
  );
}

function TrackVisual() {
  const pct = 96;
  return (
    <div
      data-testid="capability-track-visual"
      className="bg-film-cream p-5 min-h-[200px]"
    >
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
          Acme Corp · Discovery
        </span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium text-gray-900">
          Rival: Gong
        </span>
        <span className="text-[10px] font-mono text-gray-500">0.96</span>
      </div>
      <div
        className="h-2 rounded-full bg-gray-200 overflow-hidden mb-4"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Gong confidence"
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: ACCENT }}
        />
      </div>

      <blockquote className="text-[13px] text-gray-700 leading-snug border-l-2 border-film-ink pl-3 mb-3">
        &ldquo;We&rsquo;re also evaluating Gong and Chorus for the
        rollout.&rdquo;
      </blockquote>

      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full leading-none bg-emerald-700 text-white">
          #deal-room-acme
        </span>
        <span className="text-[10px] font-mono text-gray-500">Slack ping</span>
      </div>
    </div>
  );
}

function CrmVisual() {
  const fields = [
    { label: "Deal", value: "Acme Corp · Discovery" },
    { label: "Owner", value: "Sarah Chen" },
    { label: "Close date", value: "2026-10-14" },
    { label: "Next step", value: "Send competitive one-pager · THU" },
  ];
  return (
    <div
      data-testid="capability-crm-visual"
      className="bg-film-cream p-5 min-h-[200px]"
    >
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

      <dl className="rounded-xl border border-film-ink/10 bg-white divide-y divide-gray-100 mb-3">
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

      <p className="flex items-center gap-1.5 text-[10px] text-gray-500">
        <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Health 8.2
      </p>
    </div>
  );
}

function PrivacyVisual() {
  return (
    <div
      data-testid="capability-privacy-visual"
      className="bg-film-cream p-5 min-h-[200px] flex flex-col items-center justify-center text-center"
    >
      <div className="w-12 h-12 rounded-xl bg-film-ink flex items-center justify-center mb-4">
        <Shield size={20} className="text-white" strokeWidth={1.5} aria-hidden />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
        <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full border border-film-ink/20 bg-white text-gray-900">
          Never trains
        </span>
        <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full border border-film-ink/20 bg-white text-gray-900">
          Export + deletion
        </span>
        <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full border border-film-ink/20 bg-white text-gray-900">
          Disclosed providers
        </span>
      </div>
      <p className="text-[10px] font-mono text-gray-500">
        never used to train our models
      </p>
    </div>
  );
}

export function CapabilitiesBento() {
  return (
    <section
      data-track-section="capabilities"
      aria-labelledby="capabilities-heading"
      className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28 border-t border-gray-200"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-600 mb-3">
            Capabilities
          </p>
          <h2
            id="capabilities-heading"
            className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3"
          >
            Built for SDRs who lose deals to competitors they never saw coming.
          </h2>
          <p className="text-gray-500 text-[14px]">Four things. No filler.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardShell label={TITLES.upload}>
            <UploadVisual />
            <CardBody title={TITLES.upload} body={BODIES.upload} />
          </CardShell>
          <CardShell label={TITLES.track}>
            <TrackVisual />
            <CardBody title={TITLES.track} body={BODIES.track} />
          </CardShell>
          <CardShell label={TITLES.crm}>
            <CrmVisual />
            <CardBody title={TITLES.crm} body={BODIES.crm} />
          </CardShell>
          <CardShell label={TITLES.privacy}>
            <PrivacyVisual />
            <CardBody title={TITLES.privacy} body={BODIES.privacy} />
          </CardShell>
        </div>
      </div>
    </section>
  );
}

export default CapabilitiesBento;
