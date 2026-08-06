import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/get-user";
import { getSecret } from "@/lib/secrets";
import { PLANS } from "@/lib/plans";

function getPaddleEnvironment(): "production" | "sandbox" {
  return process.env.PADDLE_ENV === "production" ? "production" : "sandbox";
}

function getPaddleBaseUrl(): string {
  return getPaddleEnvironment() === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const apiKey = getSecret("PADDLE_API_KEY");
    const url = new URL(req.url);
    const queryEmail = url.searchParams.get("email");

    // The query param exists to look up the CALLER's Paddle customer via a
    // real email when the DB row holds a placeholder. Looking up any other
    // email is an enumeration oracle — reject it.
    if (queryEmail && queryEmail.toLowerCase() !== (user.email || "").toLowerCase()) {
      return NextResponse.json({ error: "email must match your account" }, { status: 403 });
    }

    // Accept real email from query param (the DB email may be a placeholder)
    const lookupEmail = (queryEmail || user.email).toLowerCase();

    const debug: any = {
      db: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        paddleCustomerId: user.paddleCustomerId,
        paddleSubscriptionId: user.paddleSubscriptionId,
        credits: user.credits,
      },
      env: {
        paddleEnv: getPaddleEnvironment(),
        baseUrl: getPaddleBaseUrl(),
        hasApiKey: !!apiKey,
      },
      paddle: null as any,
    };

    if (queryEmail) {
      debug.query = { email: queryEmail, lookupEmail };
    }

    if (!apiKey) {
      return NextResponse.json(debug);
    }

    const customerId = user.paddleCustomerId;

    if (customerId) {
      const subRes = await fetch(
        `${getPaddleBaseUrl()}/subscriptions?customer_id=${encodeURIComponent(customerId)}&per_page=10`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      debug.paddle = {
        lookupMethod: "customer_id",
        lookupValue: customerId,
        status: subRes.status,
        body: await subRes.json().catch(() => null),
      };
    } else {
      const custRes = await fetch(
        `${getPaddleBaseUrl()}/customers?email=${encodeURIComponent(lookupEmail)}&per_page=5`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      const custBody = (await custRes.json().catch(() => ({}))) as {
        data?: Array<{ id: string; email: string }>;
      };
      debug.paddle = {
        lookupMethod: "email",
        lookupValue: lookupEmail,
        status: custRes.status,
        customers: custBody.data || [],
      };
    }

    debug.mappedPriceIds = {
      pro: [PLANS.pro.paddlePriceId, PLANS.pro.paddlePriceIdAnnual],
      business: [PLANS.business.paddlePriceId, PLANS.business.paddlePriceIdAnnual],
    };

    return NextResponse.json(debug);
  } catch (error) {
    console.error("[BILLING_DEBUG] Error:", error);
    return NextResponse.json({ error: "Debug failed" }, { status: 500 });
  }
}
