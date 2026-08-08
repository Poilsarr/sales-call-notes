import Link from "next/link";
import { Download, Globe, CheckCircle2, ExternalLink, ArrowRight, Mic, Captions, FileText, ListChecks, X } from "lucide-react";
import Nav from "@/components/nav";

export const metadata = {
  title: "Chrome Extension — Gauge",
  description: "Capture Google Meet captions automatically and save calls to your Gauge dashboard with the Chrome extension.",
};

/**
 * Chrome extension landing page.
 *
 * Two paths to install:
 *   1. Chrome Web Store (preferred) — once submitted by the team
 *   2. Manual .zip download — for users who want to load it
 *      unpacked while we wait for store approval
 *
 * Design language: matches the home page hero — #EFEFEF ground,
 * orange (#F26522) accent, doppel-outer/doppel-inner depth cards,
 * 2-col hero with a product mockup on the right (here: a fake
 * Chrome-tab capturing Meet captions, with a "Live" indicator and
 * the captured transcript streaming in). The mockup is the page —
 * the user sees exactly what the extension does, not a description
 * of what it does.
 */
export default function ExtensionPage() {
  return (
    <>
      <Nav />
    <main id="main" className="min-h-screen bg-[#EFEFEF] text-gray-900">


      {/* HERO — 2-col: left copy + CTAs, right product mockup */}
      <section className="relative min-h-[100dvh] flex flex-col">
        <div className="flex-1" />
        <div className="relative z-20 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pb-14 sm:pb-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-end">
            {/* LEFT */}
            <div>
              <p className="text-[13px] leading-[14px] text-gray-900 tracking-wide mb-5 sm:mb-8">
                Gauge
              </p>
              <h1 className="text-[clamp(1.75rem,7vw,4.2rem)] sm:text-[clamp(2.5rem,5vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900">
                The call&rsquo;s over.<br className="hidden sm:block" />
                <span className="sm:hidden"> </span>Your notes are already done.
              </h1>
              <p className="text-[15px] text-gray-500 max-w-xl mt-4 mb-8">
                The Gauge Chrome extension watches the live captions in
                any Google Meet and ships a fully transcribed call to your
                dashboard the second you hang up &mdash; no upload, no recorder,
                no post-call work.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                <a
                  href="https://chromewebstore.google.com/search/gauge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] sm:text-[14px] rounded-full pl-5 sm:pl-6 pr-2 py-2"
                >
                  <Globe size={16} className="text-white/90" />
                  <span>Add to Chrome</span>
                  <span className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                    <ArrowRight size={14} className="text-[#F26522]" />
                  </span>
                </a>
                <Link
                  href="/features"
                  className="text-[13px] text-gray-600 hover:text-gray-900 font-medium underline-offset-4 hover:underline"
                >
                  See all features →
                </Link>
              </div>
            </div>

            {/* RIGHT — product mockup: Chrome tab capturing Meet captions */}
            <div className="relative">
              <div className="doppel-outer">
                <div className="doppel-inner p-4 sm:p-5">
                  {/* Chrome tab bar */}
                  <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex-1 mx-2 flex items-center gap-1.5 bg-gray-50 rounded-md px-2.5 py-1.5 min-w-0">
                      <div className="w-3 h-3 rounded-full bg-[#4285F4] flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 bg-white rounded-sm" />
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 truncate">
                        meet.google.com/abc-defg-hij · Acme × Gauge — Discovery
                      </span>
                    </div>
                    {/* Gauge extension pill — the thing being demo'd */}
                    <div className="flex items-center gap-1.5 bg-[#F26522]/[0.08] border border-[#F26522]/20 rounded-full px-2 py-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F26522] animate-pulse" />
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#F26522] font-semibold">
                        Capturing
                      </span>
                    </div>
                  </div>

                  {/* Captured captions — the actual product */}
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="shrink-0 text-[10px] font-mono font-medium text-[#2563eb] bg-[#2563eb]/[0.08] px-2 py-0.5 rounded-full leading-none mt-0.5">
                        Priya
                      </span>
                      <p className="text-[12.5px] text-gray-600 leading-snug">
                        ...we&rsquo;re leaning towards Gong right now, but I
                        wanted to see how your competitive intel alerts actually
                        work in practice.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="shrink-0 text-[10px] font-mono font-medium text-[#F26522] bg-[#F26522]/[0.08] px-2 py-0.5 rounded-full leading-none mt-0.5">
                        You
                      </span>
                      <p className="text-[12.5px] text-gray-600 leading-snug">
                        Totally fair. Happy to share a Gong call that ran
                        through us last week so you can compare the alert
                        latency side-by-side.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="shrink-0 text-[10px] font-mono font-medium text-[#2563eb] bg-[#2563eb]/[0.08] px-2 py-0.5 rounded-full leading-none mt-0.5">
                        Priya
                      </span>
                      <p className="text-[12.5px] text-gray-600 leading-snug">
                        That would be perfect. Send it over whenever &mdash; my
                        evaluation window closes end of next week.
                      </p>
                    </div>
                  </div>

                  {/* Footer status — what ships to the dashboard */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Captions className="w-3 h-3" />
                      Live captions
                    </span>
                    <span className="flex items-center gap-1.5 font-mono">
                      03:42:18
                    </span>
                    <span className="flex items-center gap-1.5 text-[#F26522] font-medium">
                      Will auto-save on hangup →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INSTALL — the "two paths" card, doppel-styled */}
      <section className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-10">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">
              Install
            </p>
            <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3">
              Two paths to live captions.
            </h2>
            <p className="text-gray-500 text-[14px]">
              The Chrome Web Store version is in review. Until then, load the
              extension unpacked from our public repo &mdash; Chrome supports
              this for trusted open-source extensions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="doppel-outer">
              <div className="doppel-inner p-6 sm:p-8 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center">
                    <Globe size={18} className="text-[#F26522]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                      Recommended
                    </p>
                    <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">
                      Chrome Web Store
                    </h3>
                  </div>
                </div>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-6 flex-1">
                  One-click install. Auto-updates. Standard permissions prompt
                  the first time you open a Meet tab.
                </p>
                <a
                  href="https://chromewebstore.google.com/search/gauge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-between gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 w-fit"
                >
                  <span>Get it on the Web Store</span>
                  <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                    <ArrowRight size={14} className="text-[#F26522]" />
                  </span>
                </a>
                <p className="text-[11px] text-gray-400 mt-4">
                  Currently in review &mdash; check back this week.
                </p>
              </div>
            </div>

            <div className="doppel-outer">
              <div className="doppel-inner p-6 sm:p-8 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-900/5 flex items-center justify-center">
                    <Download size={18} className="text-gray-700" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                      For tinkerers
                    </p>
                    <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">
                      GitHub (load unpacked)
                    </h3>
                  </div>
                </div>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-6 flex-1">
                  Full source, Apache-2.0. Clone, enable Developer mode in
                  <code className="px-1.5 py-0.5 mx-1 bg-gray-100 rounded text-[12px] font-mono">
                    chrome://extensions
                  </code>
                  , load the
                  <code className="px-1.5 py-0.5 mx-1 bg-gray-100 rounded text-[12px] font-mono">
                    /extension
                  </code>
                  folder.
                </p>
                <a
                  href="https://github.com/Poilsarr/sales-call-notes/tree/main/extension"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-between gap-2 bg-gray-900 hover:bg-gray-800 text-white text-[13px] rounded-full pl-5 pr-2 py-2 w-fit"
                >
                  <span>Open the repo</span>
                  <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                    <ExternalLink size={12} className="text-gray-900" />
                  </span>
                </a>
                <p className="text-[11px] text-gray-400 mt-4">
                  ~2 min setup. Manifest v3.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — 4 step cards in a 2x2 grid, doppel-styled */}
      <section className="bg-[#EFEFEF] pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-14">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">
              How it works
            </p>
            <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3">
              From &ldquo;meeting ended&rdquo; to searchable notes in ~10 seconds.
            </h2>
            <p className="text-gray-500 text-[14px]">
              No recording. No upload. The extension reads the captions
              Google Meet already shows on screen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                n: "01",
                title: "Install the extension",
                body: (
                  <>
                    One click from the Chrome Web Store, or
                    <code className="px-1.5 py-0.5 mx-1 bg-white border border-gray-200 rounded text-[12px] font-mono">
                      load unpacked
                    </code>
                    from GitHub. No account creation &mdash; it reuses your
                    Gauge login.
                  </>
                ),
                icon: <Globe size={18} className="text-[#F26522]" strokeWidth={1.5} />,
              },
              {
                n: "02",
                title: "Join any Google Meet",
                body: (
                  <>
                    The extension quietly attaches to the captions panel
                    whenever you&rsquo;re in a Meet. It does nothing else,
                    sees nothing else.
                  </>
                ),
                icon: <Captions size={18} className="text-[#F26522]" strokeWidth={1.5} />,
              },
              {
                n: "03",
                title: "Talk. We listen.",
                body: (
                  <>
                    Live captions stream into a buffer on your machine. Nothing
                    leaves your browser until the meeting ends.
                  </>
                ),
                icon: <Mic size={18} className="text-[#F26522]" strokeWidth={1.5} />,
              },
              {
                n: "04",
                title: "Hang up. We ship.",
                body: (
                  <>
                    Within ~10 seconds, the call shows up in your dashboard
                    &mdash; fully transcribed, speaker-labeled, with action
                    items, summary, and competitive-intel alerts.
                  </>
                ),
                icon: <ListChecks size={18} className="text-[#F26522]" strokeWidth={1.5} />,
              },
            ].map((step) => (
              <div key={step.n} className="doppel-outer">
                <div className="doppel-inner p-6 sm:p-8 h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center">
                      {step.icon}
                    </div>
                    <span className="text-[11px] font-mono text-gray-400 tracking-wider">
                      STEP {step.n}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIVACY — what it sees / what it doesn't */}
      <section className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-14">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">
              Privacy
            </p>
            <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3">
              The extension is read-only. And it&rsquo;s nosy about exactly one thing.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="doppel-outer">
              <div className="doppel-inner p-6 sm:p-8 h-full">
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                    What it sees
                  </p>
                </div>
                <ul className="space-y-3 text-[13px] text-gray-700">
                  <li className="flex gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <span>
                      The live captions text from any Google Meet tab you have
                      open.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <span>
                      The meeting title (used as the filename in your
                      dashboard).
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <span>Your existing Gauge login session.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="doppel-outer">
              <div className="doppel-inner p-6 sm:p-8 h-full">
                <div className="flex items-center gap-2 mb-5">
                  <X className="w-4 h-4 text-red-500" />
                  <p className="text-[10px] font-mono uppercase tracking-wider text-red-600 font-semibold">
                    What it does NOT see
                  </p>
                </div>
                <ul className="space-y-3 text-[13px] text-gray-700">
                  <li className="flex gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-red-400 mt-2 shrink-0" />
                    <span>Audio (no microphone access requested or used).</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-red-400 mt-2 shrink-0" />
                    <span>Video, screen content, or your camera feed.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-red-400 mt-2 shrink-0" />
                    <span>Other browser tabs or your browsing history.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-red-400 mt-2 shrink-0" />
                    <span>Your Google account, contacts, or email.</span>
                  </li>
                </ul>
                <p className="text-[12px] text-gray-500 mt-6 leading-relaxed">
                  Full disclosure in our{" "}
                  <Link
                    href="/privacy"
                    className="text-[#F26522] hover:underline underline-offset-2"
                  >
                    privacy policy
                  </Link>
                  . Source is open &mdash; you can verify every permission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — same shape as pricing page CTA */}
      <section className="bg-[#EFEFEF] pt-8 sm:pt-12 pb-16 sm:pb-20 lg:pb-28">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="doppel-outer">
            <div className="doppel-inner p-8 sm:p-12 lg:p-16 text-center">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-4">
                One more thing
              </p>
              <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3 text-gray-900">
                The extension is free while we wait for store approval.
              </h2>
              <p className="text-gray-500 mb-8 text-[14px] max-w-xl mx-auto">
                Same Gauge account. Pro features (competitive intel,
                CRM push) work the moment you upgrade.
              </p>
              <a
                href="https://chromewebstore.google.com/search/gauge"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2"
              >
                <Globe size={14} className="text-white/90" />
                <span>Add to Chrome</span>
                <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                  <ArrowRight size={14} className="text-[#F26522]" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </main>
    </>
  );
}
