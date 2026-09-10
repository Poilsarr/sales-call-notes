import { Upload, Brain, Send } from "lucide-react";

/**
 * "How it works" — 3-step process section for the home page.
 *
 * Input → signal → push, in plain words. No model names above the fold.
 * Fast transcription + sales-tuned AI under the hood (details live on /features).
 *
 * Server component — no JS shipped.
 */
const STEPS = [
  {
    n: "01",
    icon: Upload,
    title: "Bring the call",
    body: "Drop an MP3, hit record, or capture Google Meet. No bot ever joins.",
    detail: "MP3 · Record · Google Meet",
  },
  {
    n: "02",
    icon: Brain,
    title: "Get notes + next steps in about a minute",
    body: "Transcript with speakers, summary, owners and dates, BANT/MEDDIC. Fast transcription + sales-tuned AI.",
    detail: "Transcript · Summary · Owners + dates",
  },
  {
    n: "03",
    icon: Send,
    title: "Get pinged when rivals show up",
    body: "Exact quote + speaker to Slack. One click to HubSpot/Salesforce.",
    detail: "Slack · HubSpot · Salesforce",
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

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
