import Image from "next/image";
import Link from "next/link";

// Fathom demo-GIF restraint: one flagship proof point, no autoplay wall.
// Linear dark-card type: mono labels + tight tracking on dark.
// Stripe logo-strip + disclaimer: honest strip + "sample" footnote pattern.
const ROWS: {
  label: string;
  gauge: string;
  otter: string;
  manual: string;
  highlight?: boolean;
}[] = [
  {
    label: "Rival alert",
    gauge: "Slack ping w/ quote + speaker",
    otter: "—",
    manual: "Heard live or missed",
    highlight: true,
  },
  {
    label: "No-bot capture",
    gauge: "Upload, record, or Meet — no bot joins",
    otter: "Bot joins by default",
    manual: "You're already there",
  },
  {
    label: "Sales fields built-in",
    gauge: "BANT/MEDDIC, owners + dates",
    otter: "Generic summary",
    manual: "Your template, by hand",
  },
  {
    label: "CRM push",
    gauge: "One click on Pro ($9)",
    otter: "Enterprise only",
    manual: "Copy-paste",
    highlight: true,
  },
  {
    label: "Price for 5 seats",
    gauge: "$9 flat · 5 seats · 1,200 min",
    otter: "~$100/mo (5 × $20)",
    manual: "5h/week lost",
    highlight: true,
  },
  {
    label: "Data used to train models",
    gauge: "Never",
    otter: "Opt-in only",
    manual: "Stays in your docs",
  },
];

const BRANDS = [
  { src: "/brand/hubspot.svg", alt: "HubSpot" },
  { src: "/brand/salesforce.svg", alt: "Salesforce" },
  { src: "/brand/slack.png", alt: "Slack" },
  { src: "/brand/google-meet.svg", alt: "Google Meet" },
  { src: "/brand/zoom.svg", alt: "Zoom" },
  { src: "/brand/chrome.svg", alt: "Chrome" },
];

/**
 * Differentiators — Gauge vs Otter vs manual notes.
 *
 * Dark section (pairs against light UseCases to break the double-dark tunnel).
 * Values reuse src/components/features-page-client.tsx compare rows (read-only).
 *
 * Server component — no JS shipped.
 */
export default function Differentiators() {
  return (
    <section className="bg-[#0a0a0b] text-white py-16 sm:py-20 lg:py-28 border-t border-white/5">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-3">
            Why not Otter?
          </p>
          <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
            Built for the rival mention. Not the meeting minutes.
          </h2>
          <p className="text-white/50 text-[14px]">
            Generic notetakers summarize. Gauge flags the exact moment a
            competitor enters the deal — with the quote, the speaker, and a
            push to where you work.
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
                  <th scope="col" className="px-5 sm:px-6 py-4 font-medium">
                    Capability
                  </th>
                  <th
                    scope="col"
                    className="px-5 sm:px-6 py-4 font-medium text-[#F26522]"
                  >
                    Gauge
                  </th>
                  <th scope="col" className="px-5 sm:px-6 py-4 font-medium">
                    Otter.ai
                  </th>
                  <th scope="col" className="px-5 sm:px-6 py-4 font-medium">
                    Manual notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-white/5 last:border-0"
                  >
                    <th
                      scope="row"
                      className="px-5 sm:px-6 py-4 font-medium text-white/70 whitespace-nowrap"
                    >
                      {row.label}
                    </th>
                    <td className="px-5 sm:px-6 py-4 text-white font-medium">
                      {row.gauge}
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-white/45">
                      {row.otter}
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-white/45">
                      {row.manual}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] text-white/30 mt-4 max-w-2xl">
          Free 300 min/mo on both Gauge and Otter. Pro comparison at team size
          5. Public pricing side by side — see{" "}
          <Link
            href="/otter-alternative"
            className="underline underline-offset-2 hover:text-white/60"
          >
            /otter-alternative
          </Link>{" "}
          and{" "}
          <Link
            href="/vs/otter-ai"
            className="underline underline-offset-2 hover:text-white/60"
          >
            /vs/otter-ai
          </Link>
          .
        </p>

        {/* Integration strip — honest, existing assets only */}
        <div className="mt-12 border-t border-white/5 pt-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/35 mb-5 text-center">
            Works with your stack
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {BRANDS.map((b) => (
              <Image
                key={b.alt}
                src={b.src}
                alt={b.alt}
                width={96}
                height={28}
                className="h-7 w-auto opacity-50 grayscale hover:opacity-80 hover:grayscale-0 transition"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
