import { Resend } from "resend";
import { getSecret } from "@/lib/secrets";

let resendClient: Resend | null = null;

function getClient(): Resend {
  if (!resendClient) {
    const apiKey = getSecret("RESEND_API_KEY");
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — email disabled");
      return null as any;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM = getSecret("RESEND_FROM_EMAIL") || "Gauge <hello@usegauge.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://usegauge.vercel.app";

async function send(to: string, subject: string, html: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    await client.emails.send({ from: FROM, to, subject, html });
    return true;
  } catch (e) {
    console.error("Email send failed:", e);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name?: string | null) {
  const greeting = name ? `Hey ${name}` : "Welcome";
  return send(
    email,
    "Your Gauge account is ready",
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>${greeting},</h2>
      <p>Your Gauge account is live. Upload your first call recording and get AI-powered summaries, action items, and speaker identification in under 60 seconds.</p>
      <p><a href="${APP_URL}/app/record" style="background:#F26522;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Upload your first call →</a></p>
      <p style="color:#666;font-size:13px;margin-top:32px">Free tier: 300 transcription minutes/month, no credit card required.</p>
    </div>`
  );
}

export async function sendTranscriptReadyEmail(email: string, callId: string, filename: string) {
  return send(
    email,
    `Transcript ready: ${filename}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Your call is analyzed</h2>
      <p><strong>${filename}</strong> is ready with full transcript, AI summary, action items, and speaker labels.</p>
      <p><a href="${APP_URL}/app/calls/${callId}" style="background:#F26522;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View results →</a></p>
    </div>`
  );
}

export async function sendTrialExpiringEmail(email: string, daysLeft: number, name?: string | null) {
  const greeting = name ? `Hey ${name}` : "Hey";
  return send(
    email,
    `Your Gauge trial ends in ${daysLeft} days`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>${greeting},</h2>
      <p>Your free trial expires in <strong>${daysLeft} days</strong>. Upgrade to Pro ($9/mo) to keep unlimited access to AI summaries, CRM sync, and advanced analytics.</p>
      <p><a href="${APP_URL}/pricing" style="background:#F26522;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View plans →</a></p>
      <p style="color:#666;font-size:13px;margin-top:32px">After your trial, you'll keep the Free tier (300 minutes/month). No data is lost.</p>
    </div>`
  );
}

export async function sendWeeklyDigestEmail(
  email: string,
  stats: { totalCalls: number; pendingItems: number; avgHealth: number | null },
  name?: string | null
) {
  const greeting = name ? `Hey ${name}` : "Hey";
  const healthLine = stats.avgHealth !== null
    ? `<p><strong>Average Health Score:</strong> ${Math.round(stats.avgHealth * 100)}%</p>`
    : "";
  return send(
    email,
    "Your weekly Gauge digest",
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>${greeting},</h2>
      <p>Here's your week in calls:</p>
      <p><strong>Total Calls:</strong> ${stats.totalCalls}</p>
      ${healthLine}
      <p><strong>Pending Action Items:</strong> ${stats.pendingItems}</p>
      <p><a href="${APP_URL}/app/calls" style="background:#F26522;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View all calls →</a></p>
    </div>`
  );
}
