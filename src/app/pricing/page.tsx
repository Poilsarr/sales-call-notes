import { headers } from "next/headers";
import PricingClient from "@/components/pricing-client";
import { buildTiers } from "@/lib/pricing-tiers";
import Nav from "@/components/nav";

export const metadata = {
  title: "Pricing — Gauge",
  description: "Simple flat-rate pricing for Gauge. Free tier forever, affordable Pro and Business plans with no AI credit traps.",
};

/**
 * Server component: detect the visitor's country from the edge request
 * headers (Vercel sets `x-vercel-ip-country`) and pass it to the client
 * pricing component so Paddle can localize prices. If the header is
 * absent we pass null and let Paddle auto-detect from the visitor's IP.
 *
 * Paddle price IDs are server-only env vars, so we read them here (where
 * they exist) and inject them into the client as props — they must never
 * be read from process.env inside a "use client" bundle.
 *
 * Nav is rendered here because the root layout doesn't include it; the
 * global SiteFooter is already rendered by src/app/layout.tsx, so this
 * page must not render a second one.
 */
export default async function PricingPage() {
  const hdrs = await headers();
  const country = hdrs.get("x-vercel-ip-country") || null;
  // Normalize: Vercel uses "XX" for unknown/Tor; only forward real codes.
  const initialCountry =
    country && country.length === 2 && country !== "XX" ? country : null;

  const tiers = buildTiers({
    proMonth: process.env.PADDLE_PRO_PRICE_ID || "",
    proYear: process.env.PADDLE_PRO_PRICE_ID_ANNUAL || "",
    businessMonth: process.env.PADDLE_BUSINESS_PRICE_ID || "",
    businessYear: process.env.PADDLE_BUSINESS_PRICE_ID_ANNUAL || "",
  });

  return (
    <div className="min-h-screen bg-[#EFEFEF] text-gray-900 flex flex-col">
      <Nav />
      <PricingClient initialCountry={initialCountry} tiers={tiers} />
    </div>
  );
}
