import Link from "next/link";

const COMPARISONS = [
  {
    name: "Otter.ai",
    href: "/vs/otter-ai",
    hint: "Gauge wins on flat $9 pricing and never auto-joining your calls.",
  },
  {
    name: "Fireflies.ai",
    href: "/vs/fireflies",
    hint: "Gauge wins on flat-rate pricing for small teams — no per-seat math.",
  },
  {
    name: "Gong",
    href: "/vs/gong",
    hint:
      "Gauge wins on price with no platform fee (Gong figures reported).",
  },
];

/**
 * VsTeaser — honest comparison entry points.
 *
 * Server component — no JS shipped. Links to the full /vs/* pages
 * (single source of truth for claims) plus the /otter-alternative roundup.
 */
export default function VsTeaser() {
  return (
    <section
      aria-label="Comparisons"
      data-track-section="vs-teaser"
      className="bg-white border-t border-gray-200"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-3">
            Honest comparisons
          </p>
          <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
            How Gauge compares
          </h2>
          <p className="text-gray-500 text-[14px]">
            Side-by-side on price, capture, and sales fields — with the
            competitor&apos;s strengths stated fairly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COMPARISONS.map((c) => (
            <div key={c.href} className="doppel-outer h-full">
              <div className="doppel-inner p-6 h-full flex flex-col">
                <h3 className="text-[15px] font-semibold tracking-tight mb-1.5">
                  Gauge vs {c.name}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed flex-1">
                  {c.hint}
                </p>
                <Link
                  href={c.href}
                  className="mt-5 pt-4 border-t border-gray-100 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#F26522] hover:underline"
                >
                  Read comparison →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-gray-400 mt-6 max-w-2xl">
          Public pricing as of July 2026. See also{" "}
          <Link
            href="/otter-alternative"
            className="underline underline-offset-2 hover:text-gray-600"
          >
            /otter-alternative
          </Link>{" "}
          for the 7-tool roundup.
        </p>
      </div>
    </section>
  );
}
