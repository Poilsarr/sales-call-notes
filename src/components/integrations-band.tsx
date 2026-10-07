import Image from "next/image";
import Link from "next/link";

// Light Integrations band (GAUGE-MASTERPIECE P1): full-color logo grid for
// the 4 Live providers. Names + logo assets mirror the differentiators
// BRANDS strip verbatim (that const is module-private, so mirrored here
// read-only); display names are canonical per integrations-page-client.tsx
// ("HubSpot", "Salesforce", "Slack", "Microsoft Teams").
//
// Server component — no JS shipped. Light band only: bg-white +
// doppel-outer shell, accent #F26522. Full-color logos, no dark
// backgrounds, no dark-band tokens.
const LIVE_PROVIDERS = [
  { src: "/brand/hubspot.svg", alt: "HubSpot" },
  { src: "/brand/salesforce.svg", alt: "Salesforce" },
  { src: "/brand/slack.png", alt: "Slack" },
  { src: "/brand/teams.svg", alt: "Microsoft Teams" },
];

export default function IntegrationsBand() {
  return (
    <section
      data-track-section="integrations-band"
      aria-label="Integrations"
      className="bg-white text-gray-900 py-16 sm:py-20 border-t border-gray-200"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="doppel-outer">
          <div className="doppel-inner p-6 sm:p-8 bg-white">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-2 text-center">
              Works with your stack
            </p>
            <h2 className="text-center text-[clamp(1.25rem,3vw,2rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-8">
              Push call notes where{" "}
              <span className="text-[#F26522]">work happens</span>
            </h2>
            <ul className="flex flex-wrap items-start justify-center gap-x-10 gap-y-6">
              {LIVE_PROVIDERS.map((p) => (
                <li
                  key={p.alt}
                  className="inline-flex flex-col items-center gap-1.5"
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    width={96}
                    height={28}
                    className="h-7 w-auto"
                    loading="lazy"
                  />
                  <span className="text-[12px] font-medium text-gray-700">
                    {p.alt}
                  </span>
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                    Live
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-center mt-8">
              <Link
                href="/integrations"
                className="text-[13px] text-[#F26522] hover:text-[#e05a1a] font-medium underline underline-offset-4"
              >
                View all integrations →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
