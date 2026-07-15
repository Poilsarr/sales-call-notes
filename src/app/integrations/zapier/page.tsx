"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Code2, ExternalLink, Webhook, Zap } from "lucide-react";
import { toast } from "sonner";

/**
 * Zapier integration setup page.
 *
 * Flow:
 *   1. User pastes their Zap's "Catch Hook" URL (from Zapier)
 *   2. We register it via /api/webhooks (existing infrastructure)
 *   3. When Gauge analyzes a call, we POST the payload
 *      to all registered webhooks — Zapier receives it as a trigger
 *   4. User maps fields in their Zap to downstream actions
 *
 * "Test in Zapier" link opens the Zap editor with a prefilled URL
 * pointing at Zapier's public hook catcher so users can test
 * the round-trip without leaving this page.
 */
export default function ZapierSetupPage() {
  const { user, isLoaded } = useUser();
  const [hookUrl, setHookUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-medium mb-3">Sign in to connect Zapier</h1>
          <Link
            href="/sign-in"
            className="text-[#F26522] hover:underline text-sm"
          >
            Go to sign-in →
          </Link>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hookUrl.startsWith("https://hooks.zapier.com/")) {
      toast.error("Hook URL must start with https://hooks.zapier.com/");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: hookUrl }),
      });
      if (!res.ok) throw new Error("Webhook registration failed");
      toast.success("Hook URL registered. Next analyzed call will trigger your Zap.");
      setSubmitted(true);
      setHookUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/integrations"
          className="text-xs text-zinc-500 hover:text-zinc-900 mb-6 inline-block"
        >
          ← All integrations
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#FF4F00]/10 border border-[#FF4F00]/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#FF4F00]" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Connect Gauge to Zapier
          </h1>
        </div>
        <p className="text-sm text-zinc-600 mb-10">
          Push Gauge call events into 5,000+ apps — Notion, Airtable,
          Google Sheets, your custom CRM, anywhere.
        </p>

        {/* Step 1 */}
        <div className="mb-8 p-6 rounded-2xl border border-zinc-200 bg-zinc-50">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-xs font-mono text-zinc-400 mt-0.5">01</span>
            <div>
              <h2 className="text-sm font-semibold mb-1">
                Create a Zap with a &ldquo;Catch Hook&rdquo; trigger
              </h2>
              <p className="text-xs text-zinc-600">
                In Zapier, create a new Zap. Search for &ldquo;Webhooks by Zapier&rdquo;,
                choose &ldquo;Catch Hook&rdquo; as the trigger. Copy the URL Zapier gives you.
              </p>
              <a
                href="https://zapier.com/apps/webhook/integrations#triggers-and-actions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-[#FF4F00] hover:underline"
              >
                Open Zapier <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <form onSubmit={submit} className="mb-8 p-6 rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-xs font-mono text-zinc-400 mt-0.5">02</span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold mb-1">
                Paste the hook URL here
              </h2>
              <p className="text-xs text-zinc-600 mb-3">
                Must start with{" "}
                <code className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800">
                  https://hooks.zapier.com/
                </code>
              </p>
              <input
                type="url"
                value={hookUrl}
                onChange={(e) => setHookUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/12345/abcde"
                required
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:border-[#F26522]"
              />
              <button
                type="submit"
                disabled={submitting || submitted}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F26522] text-white text-xs font-semibold hover:bg-[#e05a1a] transition disabled:opacity-50"
              >
                {submitted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Registered
                  </>
                ) : submitting ? (
                  "Registering…"
                ) : (
                  <>
                    Register hook <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Step 3 */}
        <div className="mb-10 p-6 rounded-2xl border border-zinc-200 bg-zinc-50">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-xs font-mono text-zinc-400 mt-0.5">03</span>
            <div>
              <h2 className="text-sm font-semibold mb-1">Test your Zap</h2>
              <p className="text-xs text-zinc-600">
                Upload or record a new call in Gauge. Within ~60 seconds
                (transcription + analysis), your Zap will fire with the payload
                below. Map fields in Zapier&rsquo;s action step.
              </p>
            </div>
          </div>
        </div>

        {/* Payload reference */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold">Payload reference</h2>
          </div>
          <pre className="p-4 rounded-2xl bg-zinc-950 text-zinc-100 text-xs font-mono overflow-x-auto leading-relaxed">
{`POST https://hooks.zapier.com/your-hook-url
Content-Type: application/json
User-Agent: Gauge-Webhook/1.0

{
  "event": "call.analyzed",
  "callId": "ckxyz123...",
  "userId": "user_abc",
  "data": {
    "summary": "Discovery call with Acme Corp. Strong fit on Pro tier.",
    "healthScore": 78,
    "actionItems": [
      { "task": "Send proposal by Friday", "owner": "Sarah", "due": "2026-07-04" }
    ],
    "competitors": [
      { "name": "Gong", "context": "Evaluating for rollout" }
    ],
    "duration": 1820,
    "language": "en",
    "recordedAt": "2026-06-24T14:23:00Z"
  }
}`}
          </pre>
          <p className="mt-3 text-xs text-zinc-500">
            <strong>Mapping in Zapier:</strong> use the field tree under{" "}
            <code>data.summary</code>, <code>data.actionItems[].task</code>, etc.
            Zapier flattens these for you automatically.
          </p>
        </div>

        {/* Events reference */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Webhook className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold">Events</h2>
          </div>
          <div className="rounded-2xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 text-zinc-500 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Event</th>
                  <th className="px-4 py-2 font-medium">When it fires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="px-4 py-2 font-mono">call.analyzed</td>
                  <td className="px-4 py-2 text-zinc-600">
                    After a call is fully transcribed + analyzed
                  </td>
                </tr>
                <tr className="text-zinc-400">
                  <td className="px-4 py-2 font-mono">call.created</td>
                  <td className="px-4 py-2">
                    (Reserved) When a new call is uploaded — same payload shape, less data
                  </td>
                </tr>
                <tr className="text-zinc-400">
                  <td className="px-4 py-2 font-mono">call.deleted</td>
                  <td className="px-4 py-2">
                    (Reserved) When a call is deleted
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Need a custom event? Email{" "}
            <a
              href="mailto:support@usegauge.com"
              className="text-[#F26522] hover:underline"
            >
              support@usegauge.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}