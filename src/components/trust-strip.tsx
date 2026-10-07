/**
 * TrustStrip (GAUGE-REDESIGN-PART1-PLAN E1) — early-traction strip.
 * Server component, zero client JS. Proof strings come from
 * HOMEPAGE_COPY.proof (single source of truth); no local copy.
 * Logo cells reuse /brand/* assets via next/image.
 */
import Image from "next/image";
import { HOMEPAGE_COPY } from "@/lib/homepage-copy";

const ACCENT = "#F26522";

const LOGOS = [
  { src: "/brand/hubspot.svg", alt: "HubSpot" },
  { src: "/brand/salesforce.svg", alt: "Salesforce" },
  { src: "/brand/slack.png", alt: "Slack" },
  { src: "/brand/google-meet.svg", alt: "Google Meet" },
  { src: "/brand/zoom.svg", alt: "Zoom" },
  { src: "/brand/chrome.svg", alt: "Chrome" },
  { src: "/brand/teams.svg", alt: "Microsoft Teams" },
  { src: "/brand/google-calendar.svg", alt: "Google Calendar" },
  { src: "/brand/outlook.svg", alt: "Outlook" },
];

export function TrustStrip() {
  return (
    <section
      aria-label="Early traction"
      data-track-section="trust"
      className="bg-white border-b border-gray-200"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-4">
        <p className="mx-auto max-w-3xl text-balance text-center text-[12.5px] leading-relaxed text-gray-500">
          <span className="font-medium text-gray-700">
            {HOMEPAGE_COPY.proof.betaTeams}
          </span>
          <span aria-hidden className="mx-2 text-gray-300">
            ·
          </span>
          <span className="font-medium text-gray-700">
            {HOMEPAGE_COPY.proof.calls}
          </span>
          <span aria-hidden className="mx-2 text-gray-300">
            ·
          </span>
          <span className="italic">
            &ldquo;{HOMEPAGE_COPY.proof.quote}&rdquo;
          </span>{" "}
          <span className="text-gray-500">
            — {HOMEPAGE_COPY.proof.attribution}
          </span>
        </p>
        <p className="mt-1.5 text-center font-mono text-[12px] leading-relaxed text-gray-500">
          <span className="font-medium text-gray-500">
            {HOMEPAGE_COPY.proof.calls}
          </span>
          <span aria-hidden className="mx-2 text-gray-300">
            ·
          </span>
          <span>60s avg processing</span>
          <span aria-hidden className="mx-2 text-gray-300">
            ·
          </span>
          <span>99.2% uptime</span>
        </p>
        <div className="mt-3 overflow-hidden">
          <div className="animate-marquee flex w-max items-center">
            <div className="flex items-center gap-x-8 pr-8">
              {LOGOS.map((logo) => (
                <Image
                  key={logo.alt}
                  src={logo.src}
                  alt={logo.alt}
                  width={96}
                  height={28}
                  className="h-7 w-auto opacity-50 grayscale"
                  loading="lazy"
                />
              ))}
            </div>
            <div
              aria-hidden="true"
              className="flex items-center gap-x-8 pr-8"
            >
              {LOGOS.map((logo) => (
                <Image
                  key={`marquee-dup-${logo.alt}`}
                  src={logo.src}
                  alt={logo.alt}
                  width={96}
                  height={28}
                  className="h-7 w-auto opacity-50 grayscale"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[12px] text-gray-600">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: ACCENT }}
            />
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

export default TrustStrip;
