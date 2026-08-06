import { NextRequest, NextResponse } from "next/server";
import { WebhookService } from "@/services/webhooks";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/get-user";
import { getPlan, hasFeature } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null;
    try {
      ({ userId } = await auth());
    } catch {
      // auth() throws when middleware did not run for this path; treat as
      // unauthenticated instead of bubbling a 500.
    }
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(userId);
    if (!hasFeature(getPlan(user.plan), "webhooks")) {
      return NextResponse.json({ error: "Webhooks are a Business plan feature" }, { status: 403 });
    }

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    if (!url.startsWith("https://")) {
      return NextResponse.json({ error: "Webhook URL must start with https://" }, { status: 400 });
    }

    const webhooks = new WebhookService();
    await webhooks.registerWebhook(userId, url, user.teamId || undefined);

    return NextResponse.json({ success: true, message: "Webhook registered" });
  } catch (error: any) {
    const message = error?.message || "Webhook registration failed";
    if (message.includes("team")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Webhook registration failed" }, { status: 500 });
  }
}
