import { NextRequest, NextResponse } from "next/server";
import { WebhookService } from "@/services/webhooks";

export async function POST(req: NextRequest) {
  try {
    const { url, userId } = await req.json();

    if (!url || !userId) {
      return NextResponse.json({ error: "url and userId required" }, { status: 400 });
    }

    const webhooks = new WebhookService();
    await webhooks.registerWebhook(userId, url);

    return NextResponse.json({ success: true, message: "Webhook registered" });
  } catch (error) {
    return NextResponse.json({ error: "Webhook registration failed" }, { status: 500 });
  }
}
