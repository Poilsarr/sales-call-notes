import { NextRequest, NextResponse } from "next/server";
import { WebhookService } from "@/services/webhooks";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    if (!url.startsWith("https://")) {
      return NextResponse.json({ error: "Webhook URL must start with https://" }, { status: 400 });
    }

    const webhooks = new WebhookService();
    await webhooks.registerWebhook(userId, url);

    return NextResponse.json({ success: true, message: "Webhook registered" });
  } catch (error) {
    return NextResponse.json({ error: "Webhook registration failed" }, { status: 500 });
  }
}
