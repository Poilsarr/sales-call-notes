import type { Metadata } from "next";
import LivePageClient from "@/components/live-page-client";

export const metadata: Metadata = {
  title: "Live Transcription — Gauge",
  description:
    "Transcribe any conversation in real time with speaker diarization. Start the live transcription tool and get instant, searchable captions.",
  openGraph: {
    title: "Live Transcription — Gauge",
    description:
      "Transcribe any conversation in real time with speaker diarization. Start the live transcription tool and get instant, searchable captions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Transcription — Gauge",
    description:
      "Transcribe any conversation in real time with speaker diarization. Start the live transcription tool and get instant, searchable captions.",
  },
};

export default function LivePage() {
  return <LivePageClient />;
}
