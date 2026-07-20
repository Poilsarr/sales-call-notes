import { NextRequest, NextResponse } from "next/server";
import { getSecret } from "@/lib/secrets";

/**
 * Server-side Paddle price preview. The @paddle/paddle-js SDK (1.6.4) does
 * not ship a working PricePreview() at runtime, so we call Paddle's REST
 * pricing-preview endpoint directly. We only ever return Paddle's already
 * formatted totals — no price math, no re-formatting on our side.
 *
 * Body: { items: { priceId: string; quantity: number }[]; country?: string }
 * Returns: { prices: Record<priceId, formattedTotal> }
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = getSecret("PADDLE_API_KEY");
    if (!apiKey) {
      return NextResponse.json({ error: "Paddle not configured" }, { status: 503 });
    }

    const { items, country } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
    }

    const env = process.env.PADDLE_ENV === "production" ? "api.paddle.com" : "sandbox-api.paddle.com";

    const body: Record<string, unknown> = {
      // Paddle REST API expects snake_case field names.
      items: items.map((it: { priceId: string; quantity: number }) => ({
        price_id: it.priceId,
        quantity: it.quantity,
      })),
    };
    // Pass country only when the caller actually detected one (never a fake sentinel).
    if (typeof country === "string" && /^[A-Z]{2}$/.test(country) && country !== "XX") {
      body.address = { country_code: country };
    }

    const res = await fetch(`https://${env}/pricing-preview`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Paddle pricing-preview failed:", res.status, err);
      return NextResponse.json(
        { error: "Price preview failed" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const prices: Record<string, string> = {};
    for (const line of data.data?.details?.line_items ?? []) {
      if (line?.price?.id) {
        prices[line.price.id] = line.formatted_totals?.total ?? "";
      }
    }

    return NextResponse.json({ prices });
  } catch (e: any) {
    console.error("pricing-preview route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
