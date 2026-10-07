/**
 * CapabilitiesBento — visual bento replacing the theoretical Capabilities cards.
 *
 * Server component, display only: no client JS, no demo anchor id anywhere
 * in the markup. Product stills (SSOT PRODUCT_STILLS) inside .product-chrome.
 * Section shell (data-track-section, container, eyebrow, H2, sub) is kept from
 * the inline `src/app/page.tsx` block it replaces; titles/bodies below are
 * VERBATIM copies of that block's strings.
 *
 * ProductVisualCard itself is deliberately NOT reused here: it bundles its
 * own bottom copy + tape overlay + outer doppel shell, which would
 * double-nest shells and duplicate non-verbatim copy inside a bento card.
 */

import { PRODUCT_STILLS } from "@/lib/demo-call-fiction";

const STILL_SIZE = { width: 640, height: 400 } as const;

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
      className="doppel-outer"
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
      className="bg-white p-5"
    >
      <div className="product-chrome product-still-reveal">
        {/* eslint-disable-next-line @next/next/no-img-element -- img keeps vitest free of next/image mocks */}
        <img
          src={PRODUCT_STILLS.meet}
          alt="Sample meeting capture still — record without a bot joining"
          width={STILL_SIZE.width}
          height={STILL_SIZE.height}
          loading="lazy"
          className="block w-full h-auto"
        />
      </div>
      <p className="text-center text-[10px] font-mono text-gray-500 mt-3">
        sample capture · no bot ever joins the call
      </p>
    </div>
  );
}

function TrackVisual() {
  return (
    <div
      data-testid="capability-track-visual"
      className="bg-white p-5"
    >
      <div className="product-chrome product-still-reveal">
        {/* eslint-disable-next-line @next/next/no-img-element -- img keeps vitest free of next/image mocks */}
        <img
          src={PRODUCT_STILLS.radar}
          alt="Sample competitor radar board still"
          width={STILL_SIZE.width}
          height={STILL_SIZE.height}
          loading="lazy"
          className="block w-full h-auto"
        />
      </div>
      <p className="text-center text-[10px] font-mono text-gray-500 mt-3">
        sample signal · Acme Corp · Discovery
      </p>
    </div>
  );
}

function CrmVisual() {
  return (
    <div
      data-testid="capability-crm-visual"
      className="bg-white p-5"
    >
      <div className="product-chrome product-still-reveal">
        {/* eslint-disable-next-line @next/next/no-img-element -- img keeps vitest free of next/image mocks */}
        <img
          src={PRODUCT_STILLS.summary}
          alt="Sample call summary still with owners and due dates"
          width={STILL_SIZE.width}
          height={STILL_SIZE.height}
          loading="lazy"
          className="block w-full h-auto"
        />
      </div>
      <p className="text-center text-[10px] font-mono text-gray-500 mt-3">
        sample summary · HubSpot → Salesforce
      </p>
    </div>
  );
}

function PrivacyVisual() {
  return (
    <div
      data-testid="capability-privacy-visual"
      className="bg-white p-5"
    >
      <div className="product-chrome product-still-reveal">
        {/* eslint-disable-next-line @next/next/no-img-element -- img keeps vitest free of next/image mocks */}
        <img
          src={PRODUCT_STILLS.coach}
          alt="Sample coaching talk-time still"
          width={STILL_SIZE.width}
          height={STILL_SIZE.height}
          loading="lazy"
          className="block w-full h-auto"
        />
      </div>
      <p className="text-center text-[10px] font-mono text-gray-500 mt-3">
        sample view · never used to train our models
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
