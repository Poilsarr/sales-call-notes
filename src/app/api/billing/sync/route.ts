import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { getSecret } from "@/lib/secrets";
import { logAuditAction } from "@/lib/audit-logger";
import { PLANS } from "@/lib/plans";

function getPaddleEnvironment(): "production" | "sandbox" {
  return process.env.PADDLE_ENV === "production" ? "production" : "sandbox";
}

function getPaddleBaseUrl(): string {
  return getPaddleEnvironment() === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

function mapPriceIdsToPlan(priceIds: string[]): string | null {
  for (const [tier, config] of Object.entries(PLANS)) {
    const ids = [config.paddlePriceId, config.paddlePriceIdAnnual].filter(Boolean) as string[];
    if (ids.some((id) => priceIds.includes(id))) {
      return tier.toUpperCase();
    }
  }
  return null;
}

async function paddleFetch(path: string, apiKey: string, init?: RequestInit) {
  const res = await fetch(`${getPaddleBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  return res;
}

export async function POST(req: NextRequest) {
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
    if (!apiKey) {
      return NextResponse.json({ error: "Paddle API key not configured" }, { status: 503 });
    }

    // The DB email may be a placeholder (getUserByClerkId falls back to
    // clerkId@placeholder.dev when the Clerk Backend API is unreachable).
    // The caller can pass the real email from the Clerk client session.
    const body = await req.json().catch(() => ({}));
    const realEmail: string | undefined = body.email;
    const lookupEmail = (realEmail || user.email).toLowerCase();

    // If we got a real email from the client, persist it so subsequent lookups
    // (debug endpoint, retries) also work.
    if (realEmail && realEmail.toLowerCase() !== user.email.toLowerCase()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { email: realEmail.toLowerCase() },
      });
    }

    let paddleCustomerId = user.paddleCustomerId;

    if (!paddleCustomerId) {
      const customersRes = await paddleFetch(
        `/customers?email=${encodeURIComponent(lookupEmail)}&per_page=5`,
        apiKey
      );
      if (!customersRes.ok) {
        const body = await customersRes.json().catch(() => ({}));
        console.error("[BILLING_SYNC] Paddle customer lookup failed:", body);
        return NextResponse.json(
          { error: "Failed to look up Paddle customer by email" },
          { status: 502 }
        );
      }

      const customersData = (await customersRes.json()) as {
        data?: Array<{ id: string; email: string }>;
      };
      const matchedCustomer = customersData.data?.find(
        (c) => c.email.toLowerCase() === lookupEmail
      );

      if (!matchedCustomer) {
        return NextResponse.json(
          {
            error: "No Paddle customer found for this email.",
            email: lookupEmail,
            hint: "Complete a checkout first, then retry.",
          },
          { status: 404 }
        );
      }

      paddleCustomerId = matchedCustomer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { paddleCustomerId },
      });
    }

    const listRes = await paddleFetch(
      `/subscriptions?customer_id=${encodeURIComponent(paddleCustomerId)}&per_page=10`,
      apiKey
    );

    if (!listRes.ok) {
      const body = await listRes.json().catch(() => ({}));
      console.error("[BILLING_SYNC] Paddle list failed:", body);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions from Paddle" },
        { status: 502 }
      );
    }

    const listData = (await listRes.json()) as {
      data?: Array<{
        id: string;
        status: string;
        items: Array<{ price?: { id?: string; name?: string } }>;
      }>;
    };

    const subscriptions = listData.data || [];

    // Prefer the first active subscription; fall back to trialing.
    const activeSub =
      subscriptions.find((s) => s.status === "active") ||
      subscriptions.find((s) => s.status === "trialing");

    if (!activeSub) {
      // No active subscription found. If user currently has a paid plan, mark them free.
      if (user.plan !== "FREE") {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "FREE",
            subscriptionStatus: "canceled",
            credits: 5,
          },
        });
        await logAuditAction(user.id, "BILLING_SYNC_NO_ACTIVE", user.id, "User", {
          paddleCustomerId,
        });
      }
      return NextResponse.json({
        success: true,
        synced: false,
        message: "No active Paddle subscription found. Plan set to Free.",
        paddleCustomerId,
        subscriptionCount: subscriptions.length,
      });
    }

    const priceIds = activeSub.items
      .map((i) => i?.price?.id)
      .filter(Boolean) as string[];

    const plan = mapPriceIdsToPlan(priceIds);
    if (!plan) {
      return NextResponse.json(
        {
          error: "Active subscription uses an unmapped price ID",
          priceIds,
          paddleCustomerId,
          subscriptionId: activeSub.id,
          hint: "Add the Paddle price ID to lib/plans.ts or Vercel env vars.",
        },
        { status: 400 }
      );
    }

    const dbStatus = activeSub.status === "trialing" ? "active" : activeSub.status;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        paddleCustomerId,
        paddleSubscriptionId: activeSub.id,
        subscriptionStatus: dbStatus,
        subscriptionPlan: plan,
        plan: dbStatus === "active" || dbStatus === "trialing" ? plan : "FREE",
        credits: dbStatus === "active" || dbStatus === "trialing" ? 999 : 5,
      },
    });

    await logAuditAction(user.id, "BILLING_SYNC", user.id, "User", {
      subscriptionId: activeSub.id,
      plan,
      status: dbStatus,
      priceIds,
      paddleCustomerId,
    });

    return NextResponse.json({
      success: true,
      synced: true,
      plan: plan.toLowerCase(),
      subscriptionId: activeSub.id,
      paddleCustomerId,
    });
  } catch (error) {
    console.error("[BILLING_SYNC] Error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
