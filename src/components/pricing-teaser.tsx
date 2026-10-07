import Link from "next/link";
import { PLANS } from "@/lib/plans";

function formatMinutes(value: number | "unlimited"): string {
  return value === "unlimited" ? "Unlimited" : `${value.toLocaleString("en-US")}`;
}

/**
 * PricingTeaser — 3-column Free / Pro / Business teaser.
 *
 * All numbers read from src/lib/plans.ts (single source of truth):
 * Free 300 min $0 / Pro $9 1,200 min 5 seats / Business $29 6,000 min.
 * Full matrix lives on /pricing; this is the homepage teaser only.
 *
 * Server component — no JS shipped.
 */
export function PricingTeaser() {
  const free = PLANS.free;
  const pro = PLANS.pro;
  const business = PLANS.business;

  return (
    <section
      aria-label="Pricing teaser"
      data-track-section="pricing-teaser"
      className="bg-white border-t border-gray-200"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-3">
            Pricing
          </p>
          <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
            Simple pricing, flat per team
          </h2>
          <p className="text-gray-500 text-[14px]">
            Start free. Upgrade when your call volume grows — no per-seat
            math, no platform fee.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free */}
          <div className="doppel-outer h-full">
            <div className="doppel-inner p-6 h-full flex flex-col">
              <h3 className="text-[15px] font-semibold tracking-tight">
                {free.name}
              </h3>
              <p className="mt-2 text-[28px] font-medium tracking-tight">
                {free.priceLabel}
                <span className="text-[13px] font-normal text-gray-500">
                  {" "}
                  forever
                </span>
              </p>
              <p className="mt-1 text-[13px] text-gray-500">
                {formatMinutes(free.minuteLimit)} transcription minutes / month
              </p>
              <Link
                href="/sign-up"
                className="mt-5 pt-4 border-t border-gray-100 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#F26522] hover:underline"
              >
                Start free →
              </Link>
            </div>
          </div>

          {/* Pro — emphasized middle column */}
          <div className="doppel-outer h-full ring-2 ring-[#F26522] ring-offset-2">
            <div className="doppel-inner p-6 h-full flex flex-col bg-white rounded-[inherit]">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold tracking-tight">
                  {pro.name}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#F26522] text-white">
                  Most popular
                </span>
              </div>
              <p className="mt-2 text-[28px] font-medium tracking-tight">
                {pro.priceLabel}
                <span className="text-[13px] font-normal text-gray-500">
                  {" "}
                  / month
                </span>
              </p>
              <p className="mt-1 text-[13px] text-gray-500">
                {formatMinutes(pro.minuteLimit)} minutes / month ·{" "}
                {pro.teamMemberLimit} seats included
              </p>
              <Link
                href="/sign-up"
                className="mt-5 pt-4 border-t border-gray-100 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#F26522] hover:underline"
              >
                Start free →
              </Link>
            </div>
          </div>

          {/* Business */}
          <div className="doppel-outer h-full">
            <div className="doppel-inner p-6 h-full flex flex-col">
              <h3 className="text-[15px] font-semibold tracking-tight">
                {business.name}
              </h3>
              <p className="mt-2 text-[28px] font-medium tracking-tight">
                {business.priceLabel}
                <span className="text-[13px] font-normal text-gray-500">
                  {" "}
                  / month
                </span>
              </p>
              <p className="mt-1 text-[13px] text-gray-500">
                {formatMinutes(business.minuteLimit)} minutes / month ·
                unlimited seats
              </p>
              <a
                href="mailto:sales@usegauge.com?subject=Enterprise%20Plan%20Inquiry"
                className="mt-5 pt-4 border-t border-gray-100 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#F26522] hover:underline"
              >
                Contact sales →
              </a>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-6 max-w-2xl">
          Need the full matrix, annual billing, or Enterprise?{" "}
          <Link
            href="/pricing"
            className="underline underline-offset-2 hover:text-gray-600"
          >
            Compare all plans →
          </Link>
        </p>
      </div>
    </section>
  );
}

export default PricingTeaser;
