import type { Metadata } from "next";
import { Suspense } from "react";
import IntegrationsPageClient from "@/components/integrations-page-client";

export const metadata: Metadata = {
  title: "Integrations — Gauge",
  description:
    "Connect Gauge to HubSpot, Salesforce, Slack, Microsoft Teams, Google Meet, Zapier, and more. Sync call notes, transcripts, and action items to where your team already works.",
  openGraph: {
    title: "Integrations — Gauge",
    description:
      "Connect Gauge to HubSpot, Salesforce, Slack, Microsoft Teams, Google Meet, Zapier, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Integrations — Gauge",
    description:
      "Connect Gauge to HubSpot, Salesforce, Slack, Microsoft Teams, Google Meet, Zapier, and more.",
  },
};

export default function IntegrationsPage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsPageClient />
    </Suspense>
  );
}
