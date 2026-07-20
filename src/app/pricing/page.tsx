import { headers } from "next/headers";
import PricingClient from "@/components/pricing-client";
import { buildTiers } from "@/lib/pricing-tiers";

/**
 * Server component: detect the visitor's country from the edge request
 * headers (Vercel sets `x-vercel-ip-country`) and pass it to the client
 * pricing component so Paddle can localize prices. If the header is
 * absent we pass null and let Paddle auto-detect from the visitor's IP.
 *
 * Paddle price IDs are server-only env vars, so we read them here (where
 * they exist) and inject them into the client as props — they must never
 * be read from process.env inside a "use client" bundle.
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

  return <PricingClient initialCountry={initialCountry} tiers={tiers} />;
}
