import Link from "next/link";
import {
  ArrowRight,
  Captions,
  CheckCircle2,
  Globe,
  KeyRound,
  ListChecks,
  Mic,
  MousePointerClick,
  Share2,
  Wrench,
  X,
} from "lucide-react";
import Nav from "@/components/nav";

export const metadata = {
  title: "Chrome Extension — Gauge",
  description:
    "Install the Gauge Chrome extension, run the 60-second demo, and see exactly what it captures.",
};

/**
 * Chrome extension demo page (Part 6B rebuild).
 *
 * Every claim below mirrors the code it describes:
 *   - Install + key flow mirror extension/sidepanel.js (Bearer
 *     cn_live_ / cn_test_ minted via POST /api/v1/keys/exchange,
 *     kept in session memory only, Record / Stop / Send buttons).
 *   - Recent calls mirror GET /api/v1/calls, deep-linking to
 *     /app/calls/{id} for the Done summary.
 *   - Permissions mirror extension/manifest.json plus the
 *     aria-live + tab-title scrape in extension/content.js.
 *   - Upload caps mirror the per-tier table in the upload and
 *     analyze routes (free 30 / pro 200 / business 500 MB).
 *
 * No store listing is live, so the store button points at the
 * in-page #store-pending placeholder — never a store URL.
 * Nothing captures before you press Record: capture starts on your
 * click and ships when you press Send.
 */
export default function ExtensionPage() {
  return (
    <>
      <Nav />
      <main id="main" className="min-h-screen bg-[#EFEFEF] text-gray-900">
        {/* HERO — 2-col: left copy + CTAs, right side-panel mockup */}
        <section className="relative min-h-[100dvh] flex flex-col">
          <div className="flex-1" />
          <div className="relative z-20 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pb-14 sm:pb-16 lg:pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-end">
              {/* LEFT */}
              <div>
                <p className="text-[13px] leading-[14px] text-gray-900 tracking-wide mb-5 sm:mb-8">
                  Gauge Chrome extension
                </p>
                <h1 className="text-[clamp(1.75rem,7vw,4.2rem)] sm:text-[clamp(2.5rem,5vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900">
                  Your Meet notes,
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>the moment you press
                  Send.
                </h1>
                <p className="text-[15px] text-gray-500 max-w-xl mt-4 mb-8">
                  The side panel captures the meeting-tab audio and the live
                  captions while you record, then ships a transcribed call to
                  your dashboard when you press Send. Nothing captures before
                  you press Record.
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                  <a
                    href="#install"
                    className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] sm:text-[14px] rounded-full pl-5 sm:pl-6 pr-2 py-2"
                  >
                    <Globe size={16} className="text-white/90" />
                    <span>Install the extension</span>
                    <span className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                      <ArrowRight size={14} className="text-[#F26522]" />
                    </span>
                  </a>
                  <a
                    href="#demo"
                    className="text-[13px] text-gray-600 hover:text-gray-900 font-medium underline-offset-4 hover:underline"
                  >
                    Run the 60-second demo →
                  </a>
                </div>
              </div>

              {/* RIGHT — product mockup: the side panel, as it really looks */}
              <div className="relative">
                <div className="doppel-outer">
                  <div className="doppel-inner p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F26522]" />
                      <p className="text-[12px] font-semibold text-gray-900">
                        Gauge Recorder
                      </p>
                    </div>
                    <p className="text-[11px] text-gray-400 mb-4">
                      The key stays in session memory only.
                    </p>

                    {/* API key card */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 mb-3">
                      <p className="text-[11px] font-semibold text-gray-700 mb-2">
                        API key
                      </p>
                      <div className="flex gap-2">
                        <span className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 py-2 font-mono text-[11px] text-gray-400 truncate">
                          cn_live_…
                        </span>
                        <span className="rounded-lg bg-gray-900 px-3 py-2 text-[11px] font-semibold text-white">
                          Save
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">
                        No key saved for this session.
                      </p>
                    </div>

                    {/* Recording card */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 mb-3">
                      <p className="text-[11px] font-semibold text-gray-700 mb-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />
                        Recording…
                      </p>
                      <div className="flex gap-2">
                        {["Record", "Stop", "Send"].map((label) => (
                          <span
                            key={label}
                            className="flex-1 rounded-lg bg-gray-900 px-2 py-2 text-center text-[11px] font-semibold text-white"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">
                        Open a Meet / Teams / Zoom tab, then press Record.
                      </p>
                    </div>

                    {/* Recent calls card */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-[11px] font-semibold text-gray-700 mb-2">
                        Recent calls
                      </p>
                      <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
                        <p className="text-[11px] text-gray-700 font-medium">
                          Acme × Gauge — Discovery
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          score 82 · extension
                        </p>
                      </div>
                    </div>

                    {/* Footer status — the exact idle status from the panel */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Captions className="w-3 h-3" />
                        Live captions
                      </span>
                      <span className="flex items-center gap-1.5 text-[#F26522] font-medium">
                        Tab audio is captured only while recording
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INSTALL — 3 steps */}
        <section
          id="install"
          className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28 scroll-mt-20"
        >
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
            <div className="max-w-2xl mb-10">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">
                Install
              </p>
              <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3">
                Install in three steps.
              </h2>
              <p className="text-gray-500 text-[14px]">
                Load the extension unpacked, connect it with an API key, and
                press Save. The key lives in session memory only — it never
                touches disk.
              </p>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 list-none">
              <li className="doppel-outer">
                <div className="doppel-inner p-6 sm:p-8 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                    <Globe
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-gray-400 tracking-wider mb-2">
                    STEP 1
                  </p>
                  <h3 className="text-[15px] font-semibold tracking-tight text-gray-900 mb-2">
                    Load the extension unpacked
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    Open{" "}
                    <code className="px-1.5 py-0.5 bg-gray-100 rounded text-[12px] font-mono">
                      chrome://extensions
                    </code>{" "}
                   , enable Developer mode, and load the extension folder.
                    Manifest v3.
                  </p>
                </div>
              </li>

              <li id="store-pending" className="doppel-outer scroll-mt-24">
                <div className="doppel-inner p-6 sm:p-8 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                    <MousePointerClick
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-gray-400 tracking-wider mb-2">
                    STEP 2
                  </p>
                  <h3 className="text-[15px] font-semibold tracking-tight text-gray-900 mb-2">
                    Prefer one-click? Wait for the store
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed mb-4">
                    The Chrome Web Store listing is still pending review, so
                    there is no live install link yet. This placeholder will
                    become the install button the day it ships.
                  </p>
                  <a
                    href="#store-pending"
                    className="text-[13px] text-gray-400 font-medium underline-offset-4 underline cursor-not-allowed"
                    aria-disabled="true"
                  >
                    Add to Chrome — coming soon
                  </a>
                </div>
              </li>

              <li className="doppel-outer">
                <div className="doppel-inner p-6 sm:p-8 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                    <KeyRound
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-gray-400 tracking-wider mb-2">
                    STEP 3
                  </p>
                  <h3 className="text-[15px] font-semibold tracking-tight text-gray-900 mb-2">
                    Paste your API key and press Save
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    Copy a key shaped{" "}
                    <code className="px-1.5 py-0.5 bg-gray-100 rounded text-[12px] font-mono">
                      cn_live_…
                    </code>{" "}
                    or{" "}
                    <code className="px-1.5 py-0.5 bg-gray-100 rounded text-[12px] font-mono">
                      cn_test_…
                    </code>{" "}
                    from{" "}
                    <Link
                      href="/settings?tab=api-keys"
                      className="text-[#F26522] hover:underline underline-offset-2"
                    >
                      Settings → API Keys
                    </Link>{" "}
                    (minted via{" "}
                    <code className="px-1.5 py-0.5 bg-gray-100 rounded text-[12px] font-mono">
                      POST /api/v1/keys/exchange
                    </code>
                    ), paste it into the panel&apos;s API key field, and press
                    Save. The panel confirms with “Key saved. Press Record on
                    a meeting tab.” Full reference in the{" "}
                    <Link
                      href="/api-docs/v1"
                      className="text-[#F26522] hover:underline underline-offset-2"
                    >
                      API docs
                    </Link>
                    .
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* DEMO — 60-second script, steps 1–6 */}
        <section
          id="demo"
          className="bg-[#EFEFEF] pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28 scroll-mt-20"
        >
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
            <div className="max-w-2xl mb-14">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">
                Demo script
              </p>
              <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3">
                The 60-second demo.
              </h2>
              <p className="text-gray-500 text-[14px]">
                Six steps, using the exact labels from the side panel: Record,
                Stop, Send, and the Done summary at /app/calls/{`{id}`}.
              </p>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none">
              {[
                {
                  n: "01",
                  title: "Open a meeting tab with captions on",
                  body: "Join any Meet, Teams, or Zoom call and switch captions on. The panel status reads “Open a Meet / Teams / Zoom tab, then press Record.” With captions off there is nothing for the panel to read.",
                  icon: (
                    <Captions
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  ),
                },
                {
                  n: "02",
                  title: "Paste your key and press Save",
                  body: "Paste a cn_live_… or cn_test_… key into the API key field and press Save. The key is required for upload and is kept in session memory only.",
                  icon: (
                    <KeyRound
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  ),
                },
                {
                  n: "03",
                  title: "Press Record and talk",
                  body: "Press Record. The dot turns red and the panel reports “Recording tab audio (32kbps Opus) + captions. Press Stop when done.” Tab audio is captured only while recording.",
                  icon: (
                    <Mic size={18} className="text-[#F26522]" strokeWidth={1.5} />
                  ),
                },
                {
                  n: "04",
                  title: "Press Stop, then Send",
                  body: "Press Stop — the panel shows “Stopped. Uploading audio + finalizing captions…” — then press Send to finalize the captions for the meeting.",
                  icon: (
                    <MousePointerClick
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  ),
                },
                {
                  n: "05",
                  title: "Open the Done summary",
                  body: "When the upload lands, the panel reports “Done - summary:” with a link to /app/calls/{id}. The same call appears under Recent calls, loaded via GET /api/v1/calls, with its health score in the row meta.",
                  icon: (
                    <ListChecks
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  ),
                },
                {
                  n: "06",
                  title: "Share the digest",
                  body: "Open the call page to forward the summary. The Slack digest carries the same summary plus the health score, so the team sees the outcome without opening the dashboard.",
                  icon: (
                    <Share2
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  ),
                },
              ].map((step) => (
                <li key={step.n} className="doppel-outer">
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
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* PERMISSIONS — truth table */}
        <section className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
            <div className="max-w-2xl mb-14">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">
                Permissions
              </p>
              <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3">
                What the extension can see.
              </h2>
              <p className="text-gray-500 text-[14px]">
                The scraper reads only live-caption regions and the tab title
                on meeting pages. Capture starts on your Record click and the
                stream is released on Stop.
              </p>
            </div>

            <div className="doppel-outer">
              <div className="doppel-inner p-6 sm:p-8 overflow-x-auto">
                <table className="w-full text-left text-[13px] min-w-[520px]">
                  <caption className="sr-only">
                    What the extension captures and what it never captures
                  </caption>
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th scope="col" className="pb-4 pr-4 w-1/2">
                        <span className="flex items-center gap-2 text-emerald-700 font-semibold text-[11px] font-mono uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Captures
                        </span>
                      </th>
                      <th scope="col" className="pb-4 pl-4 w-1/2">
                        <span className="flex items-center gap-2 text-red-600 font-semibold text-[11px] font-mono uppercase tracking-wider">
                          <X className="w-4 h-4 text-red-500" />
                          Never captures
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        Live caption text from aria-live regions on the meeting
                        tab (Meet, Teams, Zoom)
                      </td>
                      <td className="py-3 pl-4">
                        Anything before you press Record — capture never
                        auto-starts
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        Meeting-tab audio at 32kbps Opus, only between Record
                        and Stop
                      </td>
                      <td className="py-3 pl-4">
                        Microphone input directly — no microphone permission is
                        requested
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        Meeting title from the tab title, used as the call name
                      </td>
                      <td className="py-3 pl-4">
                        Camera, video, or screen content
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        Caption buffer and upload state in local storage, so a
                        closed tab never loses captions
                      </td>
                      <td className="py-3 pl-4">
                        Other tabs or browsing history
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">
                        Bearer API key in session memory only — never written
                        to disk
                      </td>
                      <td className="py-3 pl-4">
                        Google account, contacts, or email
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[12px] text-gray-500 mt-6 leading-relaxed">
                  Full disclosure in our{" "}
                  <Link
                    href="/privacy"
                    className="text-[#F26522] hover:underline underline-offset-2"
                  >
                    privacy policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TROUBLESHOOTING — 5 entries */}
        <section className="bg-[#EFEFEF] pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
            <div className="max-w-2xl mb-14">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">
                Troubleshooting
              </p>
              <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3">
                When something looks wrong.
              </h2>
              <p className="text-gray-500 text-[14px]">
                Five fixes for the five failures the panel actually reports.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="doppel-outer">
                <div className="doppel-inner p-6 sm:p-8 h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                    <Wrench
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-gray-900 mb-2">
                    No captions are captured
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    Turn captions (CC) on in the meeting. The panel reads only
                    aria-live caption regions and the tab title, so with
                    captions off there is nothing to scrape — the status stays
                    on “Open a Meet / Teams / Zoom tab, then press Record.”
                  </p>
                </div>
              </div>

              <div className="doppel-outer">
                <div className="doppel-inner p-6 sm:p-8 h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                    <Wrench
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-gray-900 mb-2">
                    Upload fails with 413
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    The file is over your plan&apos;s server-side cap: Free
                    30MB, Pro 200MB, Business 500MB. Record a shorter segment
                    or upgrade, then press Send again.
                  </p>
                </div>
              </div>

              <div className="doppel-outer">
                <div className="doppel-inner p-6 sm:p-8 h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                    <Wrench
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-gray-900 mb-2">
                    Key rejected with 401 or 403
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    The panel shows “Key rejected (401/403). Paste a fresh key
                    above.” Mint a new key via POST /api/v1/keys/exchange or
                    from{" "}
                    <Link
                      href="/settings?tab=api-keys"
                      className="text-[#F26522] hover:underline underline-offset-2"
                    >
                      Settings → API Keys
                    </Link>
                    , paste it, and press Save.
                  </p>
                </div>
              </div>

              <div className="doppel-outer">
                <div className="doppel-inner p-6 sm:p-8 h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                    <Wrench
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-gray-900 mb-2">
                    Should I use a meeting bot instead?
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    Use the extension when you attend the call in your browser.
                    For meetings you cannot join — or calls with no captions —
                    dispatch a meeting bot via POST /api/v1/bots instead. Same
                    dashboard, same call pages.
                  </p>
                </div>
              </div>

              <div className="doppel-outer md:col-span-2">
                <div className="doppel-inner p-6 sm:p-8 h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center mb-5">
                    <Wrench
                      size={18}
                      className="text-[#F26522]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-gray-900 mb-2">
                    Automatic upload is unavailable
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    Manual fallback: press Stop, download the captured audio,
                    and upload it by hand at{" "}
                    <Link
                      href="/app/record"
                      className="text-[#F26522] hover:underline underline-offset-2"
                    >
                      /app/record
                    </Link>
                    . Your captions are still saved locally by the extension.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#EFEFEF] pt-8 sm:pt-12 pb-16 sm:pb-20 lg:pb-28">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
            <div className="doppel-outer">
              <div className="doppel-inner p-8 sm:p-12 lg:p-16 text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-4">
                  One more thing
                </p>
                <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3 text-gray-900">
                  Press Record on your next call.
                </h2>
                <p className="text-gray-500 mb-8 text-[14px] max-w-xl mx-auto">
                  Same Gauge account. Recent calls, health scores, and the
                  Slack digest work the moment your key is saved.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/app/record"
                    className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2"
                  >
                    <span>Open the manual fallback</span>
                    <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                      <ArrowRight size={14} className="text-[#F26522]" />
                    </span>
                  </Link>
                  <Link
                    href="/api-docs/v1"
                    className="text-[13px] text-gray-600 hover:text-gray-900 font-medium underline-offset-4 hover:underline"
                  >
                    Read the API docs →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
