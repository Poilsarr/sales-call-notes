import { headers } from "next/headers";
import PricingClient from "@/components/pricing-client";

/**
 * Server component: detect the visitor's country from the edge request
 * headers (Vercel sets `x-vercel-ip-country`) and pass it to the client
 * pricing component so Paddle can localize prices. If the header is
 * absent we pass null and let Paddle auto-detect from the visitor's IP.
 */
export default async function PricingPage() {
  const hdrs = await headers();
  const country = hdrs.get("x-vercel-ip-country") || null;
  // Normalize: Vercel uses "XX" for unknown/Tor; only forward real codes.
  const initialCountry =
    country && country.length === 2 && country !== "XX" ? country : null;

  return <PricingClient initialCountry={initialCountry} />;
}
