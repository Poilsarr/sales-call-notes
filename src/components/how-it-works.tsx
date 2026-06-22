import { Upload, Mic, Brain, Send } from "lucide-react";

/**
 * "How it works" — 4-step process section for the home page.
 *
 * Explains the sales-call journey from upload to CRM push in plain English.
 * The icons match the workflow numbering so visitors can see the order.
 *
 * Server component — no JS shipped.
 */
const STEPS = [
  {
    n: "01",
    icon: Upload,
    title: "Drop the call",
    body:
      "Drag an MP3, paste a recording URL, or pipe from our Chrome extension. Files up to 500 MB, 4 hours each.",
    detail: "MP3 · WAV · M4A · WebM · OGG · FLAC",
  },
  {
    n: "02",
    icon: Mic,
    title: "Whisper transcribes",
    body:
      "Whisper Large V3 handles accents, crosstalk, and bad phone audio. 99 languages, auto-detect. ~30s for a 10-minute call.",
    detail: "98.2% accuracy on Switchboard benchmark",
  },
  {
    n: "03",
    icon: Brain,
    title: "AI extracts the signal",
    body:
      "Summary, decisions, action items with owners + due dates, MEDDIC fields, and every competitor mention on the call.",
    detail: "GPT-4o with a sales-tuned prompt",
  },
  {
    n: "04",
    icon: Send,
    title: "Push to CRM or Slack",
    body:
      "One click to push structured notes to HubSpot or Salesforce. Slack pings fire the moment a competitor is named on a call.",
    detail: "HubSpot · Salesforce · Slack · Webhooks",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-28 border-t border-gray-100">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">
            How it works
          </p>
          <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3">
            From raw recording to CRM-ready notes in under 60 seconds.
          </h2>
          <p className="text-gray-500 text-[14px]">
            No bots in your meetings. No new tab to learn. Drop the file, get the
            notes.
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <li key={s.n} className="relative">
              <div className="doppel-outer h-full">
                <div className="doppel-inner p-6 sm:p-8 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center">
                      <s.icon size={18} className="text-[#F26522]" strokeWidth={1.5} />
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.18em] text-gray-400">
                      STEP {s.n}
                    </span>
                  </div>
                  <h3 className="font-semibold tracking-tight text-gray-900 mb-2 text-[15px]">
                    {s.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed flex-1">
                    {s.body}
                  </p>
                  <p className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400 font-mono">
                    {s.detail}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
