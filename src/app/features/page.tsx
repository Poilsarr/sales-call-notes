import type { Metadata } from "next";
import FeaturesPageClient from "@/components/features-page-client";

export const metadata: Metadata = {
  title: "Features — Gauge",
  description:
    "AI transcription, smart summaries, action item extraction, CRM export, speaker diarization, and competitive intelligence. See everything Gauge can do for your sales calls.",
  openGraph: {
    title: "Features — Gauge",
    description:
      "AI transcription, smart summaries, action item extraction, CRM export, speaker diarization, and competitive intelligence.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features — Gauge",
    description:
      "AI transcription, smart summaries, action item extraction, CRM export, speaker diarization, and competitive intelligence.",
  },
};

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}
