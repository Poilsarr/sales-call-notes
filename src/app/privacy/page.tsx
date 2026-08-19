import Link from "next/link";
import Nav from "@/components/nav";

export const metadata = {
  title: "Data Processing & Privacy — Gauge",
  description:
    "How Gauge processes, stores, and protects your call audio and transcripts — cloud providers by name, retention controls, and export.",
};

/**
 * Public data-processing page. States exactly how audio and transcripts
 * are handled: cloud processing by named providers, nothing processed on
 * the user's device, no certification claims of any kind (see 4e38488).
 *
 * Server component — no JS shipped. Footer comes from the root layout.
 */
export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main id="main" className="min-h-screen bg-[#0a0a0b] text-white">
        <section className="pt-20 pb-24 px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#F26522] mb-4">
                <span className="w-2 h-2 rounded-full bg-[#F26522]" />
                Data processing
              </div>
              <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-3">
                Data processing &amp; privacy
              </h1>
              <p className="text-white/50 text-[14px] max-w-xl">
                A plain-language description of how Gauge processes, stores,
                and protects your call audio and transcripts — including every
                cloud provider involved, by name.
              </p>
            </div>

            <div className="space-y-12">
              <section>
                <h2 className="text-[clamp(1.4rem,3.5vw,2rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
                  Where your calls are processed
                </h2>
                <p className="text-white/70 text-[14px] leading-relaxed mb-4">
                  When you record or upload a call, the audio and the derived
                  transcript are processed in the cloud by the providers below.
                  Nothing is processed locally on your device — the audio is
                  sent to our infrastructure for transcription and analysis.
                </p>
                <ul className="space-y-2.5 text-white/70 text-[14px] leading-relaxed">
                  <li>
                    <span className="text-white font-medium">Groq</span> —
                    transcription of call audio (whisper-large-v3).
                  </li>
                  <li>
                    <span className="text-white font-medium">OpenAI</span> —
                    whisper-1 used as the transcription fallback, plus
                    analysis (summaries, action items, decisions) and
                    embeddings when those features are enabled.
                  </li>
                  <li>
                    <span className="text-white font-medium">Deepgram</span> —
                    speaker diarization, so we can label who said what.
                  </li>
                  <li>
                    <span className="text-white font-medium">Vercel Blob</span> —
                    storage of uploaded audio files.
                  </li>
                  <li>
                    <span className="text-white font-medium">Upstash Redis</span> —
                    background queues and rate limiting.
                  </li>
                  <li>
                    <span className="text-white font-medium">Neon (Postgres)</span> —
                    the database that stores your account, call records, and
                    transcripts.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-[clamp(1.4rem,3.5vw,2rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
                  What we don&apos;t do
                </h2>
                <ul className="space-y-2.5 text-white/70 text-[14px] leading-relaxed list-disc list-inside">
                  <li>
                    We don&apos;t process calls locally on your device. All audio
                    and transcripts are processed in the cloud by the
                    providers listed above.
                  </li>
                  <li>
                    We do not use your call data to train or fine-tune any model.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-[clamp(1.4rem,3.5vw,2rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
                  Retention &amp; your controls
                </h2>
                <ul className="space-y-2.5 text-white/70 text-[14px] leading-relaxed list-disc list-inside">
                  <li>
                    <span className="text-white font-medium">Delete a call</span> —
                    delete any call from your history at any time. Deleting a
                    call removes the call record and its stored audio.
                  </li>
                  <li>
                    <span className="text-white font-medium">Delete your account</span> —
                    permanently delete your account and all associated data
                    from{" "}
                    <Link
                      href="/settings"
                      className="text-[#F26522] hover:text-[#ff8a4a] underline-offset-4 hover:underline"
                    >
                      Settings
                    </Link>{" "}
                    at any time.
                  </li>
                  <li>
                    <span className="text-white font-medium">Export your data</span> —
                    request a full JSON export of your data (GDPR) from{" "}
                    <Link
                      href="/settings"
                      className="text-[#F26522] hover:text-[#ff8a4a] underline-offset-4 hover:underline"
                    >
                      Settings → Data &amp; privacy → Request export
                    </Link>
                    . A time-limited download link is emailed to you, and the
                    export is rebuilt on demand when you open it.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-[clamp(1.4rem,3.5vw,2rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
                  Security
                </h2>
                <ul className="space-y-2.5 text-white/70 text-[14px] leading-relaxed list-disc list-inside">
                  <li>
                    Audio files are stored in private cloud storage, not on
                    any public URL. Playback goes through an authenticated
                    proxy that checks access before serving a file.
                  </li>
                  <li>
                    API and upload endpoints are rate limited to protect your
                    account and our infrastructure.
                  </li>
                  <li>
                    Integration credentials (for example HubSpot or Salesforce
                    tokens) are encrypted at rest with AES-256-GCM envelope
                    encryption before they are stored.
                  </li>
                </ul>
              </section>

              <div className="pt-8 border-t border-white/10 text-center">
                <p className="text-[12px] text-white/40 mb-2">
                  Questions about how we process your data?
                </p>
                <Link
                  href="mailto:support@usegauge.com"
                  className="text-[13px] text-[#F26522] hover:text-[#ff8a4a] underline-offset-4 hover:underline"
                >
                  support@usegauge.com
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}