import { Upload, Brain, Send, Mic, Video } from "lucide-react";

const ACCENT = "#F26522";

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

/**
 * Coded mini-visuals (VISUAL-DENSITY D1) — simplified capabilities-bento
 * tokens (bg-film-cream, #F26522, mono stamps). Decorative only; step titles,
 * bodies, STEP labels, and mono footers stay verbatim. No binaries, no new
 * claims: every token reuses words already in the step copy.
 */
function DropzoneMini() {
  return (
    <div
      data-testid="how-visual-dropzone"
      aria-hidden
      className="bg-film-cream rounded-xl border border-film-ink/10 p-4 mb-5"
    >
      <div className="rounded-lg border-2 border-dashed border-film-ink/20 bg-white p-3">
        <div className="flex items-center justify-center gap-2 mb-2.5">
          <Upload size={13} className="text-gray-500" />
          <span className="text-[12px] font-medium text-gray-900">
            Drop an MP3
          </span>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full leading-none bg-film-ink text-white">
            MP3
          </span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-film-ink text-white px-3 py-1 text-[11px] font-medium">
            <Mic size={11} />
            Record
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-film-ink px-3 py-1 text-[11px] font-medium text-gray-900 bg-white">
            <Video size={11} />
            Google Meet
          </span>
        </div>
      </div>
      <p className="text-center text-[10px] font-mono text-gray-500 mt-2.5">
        no bot ever joins
      </p>
    </div>
  );
}

function TranscriptLinesMini() {
  const rows = [
    { speaker: "REP", bars: ["w-3/4", "w-1/2"] },
    { speaker: "YOU", bars: ["w-2/3"] },
    { speaker: "REP", bars: ["w-3/5", "w-1/3"] },
  ];
  return (
    <div
      data-testid="how-visual-transcript"
      aria-hidden
      className="bg-film-cream rounded-xl border border-film-ink/10 p-4 mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono tracking-wider text-gray-600 uppercase">
          Transcript
        </span>
        <span className="ml-auto text-[10px] font-mono text-gray-500">
          Summary
        </span>
      </div>
      <ul className="space-y-2.5 mb-3">
        {rows.map((row, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="shrink-0 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-white border border-film-ink/10 text-gray-600">
              {row.speaker}
            </span>
            <span className="flex-1 space-y-1.5 pt-0.5">
              {row.bars.map((w, j) => (
                <span
                  key={j}
                  className={`block h-1.5 rounded-full bg-film-ink/15 ${w}`}
                />
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p className="rounded-lg bg-white border border-gray-100 px-3 py-2 text-[10px] font-mono text-gray-500">
        Owners + dates
      </p>
    </div>
  );
}

function SlackPingMini() {
  return (
    <div
      data-testid="how-visual-slack-ping"
      aria-hidden
      className="bg-film-cream rounded-xl border border-film-ink/10 p-4 mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: ACCENT }}
        />
        <span className="text-[10px] font-mono tracking-wider text-gray-600 uppercase">
          Slack
        </span>
        <span className="ml-auto text-[10px] font-mono text-gray-500">
          exact quote + speaker
        </span>
      </div>
      <div className="rounded-lg bg-white border border-gray-100 px-3 py-2.5">
        <p className="text-[12px] text-gray-700 leading-snug border-l-2 border-film-ink pl-2.5 mb-2.5">
          &ldquo;We&rsquo;re also looking at Gong.&rdquo;
        </p>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full leading-none bg-emerald-700 text-white">
            #deal-room
          </span>
          <span className="text-[10px] font-mono text-gray-500">
            HubSpot · Salesforce
          </span>
        </div>
      </div>
    </div>
  );
}

const VISUALS: Record<string, () => React.JSX.Element> = {
  "01": DropzoneMini,
  "02": TranscriptLinesMini,
  "03": SlackPingMini,
};

export default function HowItWorks() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-28 border-t border-gray-100">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-600 mb-3">
            How it works
          </p>
          <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3">
            From raw recording to CRM-ready notes in under 60 seconds.
          </h2>
          <p className="text-gray-500 text-[14px]">
            No bots in your meetings. No new tab to learn. Drop the file, get the
            notes.
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s) => {
            const Visual = VISUALS[s.n];
            return (
            <li key={s.n} className="relative">
              <div className="doppel-outer h-full">
                <div className="doppel-inner p-6 sm:p-8 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center">
                      <s.icon size={18} className="text-[#F26522]" strokeWidth={1.5} />
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.18em] text-gray-600">
                      STEP {s.n}
                    </span>
                  </div>
                  <Visual />
                  <h3 className="font-semibold tracking-tight text-gray-900 mb-2 text-[15px]">
                    {s.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed flex-1">
                    {s.body}
                  </p>
                  <p className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 font-mono">
                    {s.detail}
                  </p>
                </div>
              </div>
            </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
