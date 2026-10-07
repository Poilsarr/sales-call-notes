import { NextResponse } from "next/server";
import { PLANS } from "@/lib/plans";

/**
 * Public price-ID resolver for the client upgrade modal.
 *
 * The modal is a client component (`src/components/upgrade-prompt.tsx`)
 * and must never read `process.env.PADDLE_*` (undefined in the browser)
 * or import placeholder fallbacks from `lib/plans`. The pricing page
 * solves this by injecting real price IDs from its server component, but
 * app routes like `/app/intelligence` are client-only and need a
 * server fetch.  Previously they used `GET /api/billing/debug`, which is
 * 404 in production (intentionally blocked), causing every checkout
 * attempt to fail with "Payment system unavailable".
 *
 * This route is intentionally public (no auth) and returns only the
 * Paddle price IDs — already public identifiers used in the frontend
 * checkout — with no sensitive billing state. Cache is disabled so
 * rotations take effect immediately.
 */
export async function GET() {
  const mappedPriceIds = {
    pro: [PLANS.pro.paddlePriceId, PLANS.pro.paddlePriceIdAnnual],
    business: [PLANS.business.paddlePriceId, PLANS.business.paddlePriceIdAnnual],
  };

  return NextResponse.json({ mappedPriceIds }, {
    headers: { "Cache-Control": "no-store" },
  });
}
