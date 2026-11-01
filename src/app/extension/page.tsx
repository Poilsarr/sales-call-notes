import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import Nav from "@/components/nav";
import { LiveDiv, LiveSection } from "@/components/extension-live";

export const metadata = {
  title: "Chrome Extension — Gauge",
  description:
    "Install the Gauge Chrome extension, run the 60-second demo, and see exactly what it captures.",
};

/**
 * Chrome extension demo page (Part 6B rebuild; obsidian restyle ported
 * from studio-artboards/fe-*-v1.html).
 *
 * Every claim below mirrors the code it describes:
 *   - Install + key flow mirror extension/sidepanel.js (Bearer keys
 *     minted via POST /api/v1/keys/exchange, kept in session memory
 *     only, Record / Stop / Send buttons).
 *   - Recent calls mirror GET /api/v1/calls, deep-linking to
 *     /app/calls/{id} for the Done summary.
 *   - Permissions mirror extension/manifest.json plus the aria-live +
 *     tab-title scrape in extension/content.js.
 *   - Upload caps mirror the per-tier table in the upload and analyze
 *     routes (Free 30MB / Pro 200MB / Business 500MB).
 *
 * No store listing is live, so the store card carries id="store-pending"
 * and the page ships a direct .zip download instead — never a store URL.
 * Nothing captures before you press Record: capture starts on your
 * click and ships when you press Send.
 */
export default function ExtensionPage() {
  return (
    <>
      <Nav />
      <main id="main" className="fex-page min-h-screen bg-[#EFEFEF] text-gray-900">
        {/* HERO — copy left, live console island right (fe-hero artboard) */}
        <section className="relative min-h-[100dvh] flex flex-col">
          <div className="flex-1" />
          <div className="relative z-20 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pb-14 sm:pb-16 lg:pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-end">
              {/* LEFT — exact copy carried over from the previous build */}
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
                    href="/gauge-extension-1.0.0.zip"
                    download="gauge-extension-1.0.0.zip"
                    className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] sm:text-[14px] font-medium rounded-full pl-5 sm:pl-6 pr-2 py-2 shadow-sm transition-all duration-200"
                  >
                    <Download size={16} className="text-white/90" />
                    <span>Download Extension (.zip)</span>
                    <span className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
                      <ArrowRight size={14} className="text-[#F26522]" />
                    </span>
                  </a>
                  <a
                    href="#install"
                    className="text-[13px] text-gray-600 hover:text-gray-900 font-medium underline-offset-4 hover:underline"
                  >
                    Installation steps ↓
                  </a>
                </div>
              </div>

              {/* RIGHT — the side panel playing itself: a real console
                  still, REC pill blinking only while on screen */}
              <LiveDiv className="relative flex justify-center lg:justify-end py-6 lg:py-10">
                <div className="fex-island">
                  <div className="fex-imeta">
                    <span className="fex-ilabel">
                      <b>Side panel</b> · what 60 seconds buys
                    </span>
                    <span className="fex-itag">Sample</span>
                  </div>

                  <div className="fex-panel">
                    <div className="fex-phead">
                      <span className="fex-orb">G</span>
                      <span className="fex-pname">Gauge Recorder</span>
                      <span className="fex-recpill">
                        <i aria-hidden="true" />
                        REC 00:14
                      </span>
                    </div>

                    <div className="fex-keyrow">
                      <span className="fex-keylabel">API key</span>
                      <span className="fex-keychip">cn_live_…</span>
                      <span className="fex-savebtn">
                        Save<s aria-hidden="true" />
                      </span>
                    </div>

                    <div
                      className="fex-logstack"
                      role="img"
                      aria-label="Side panel log — captions recording in progress, upload finished line queued"
                    >
                      <span className="fex-log">
                        <i aria-hidden="true" className="fex-dot-amb" />
                        Open a Meet / Teams / Zoom tab, then press Record.
                      </span>
                      <span className="fex-log">
                        <i aria-hidden="true" className="fex-dot-em" />
                        Key saved · session memory only.
                      </span>
                      <span className="fex-log fex-lit">
                        <i aria-hidden="true" className="fex-dot-red" />
                        Recording tab audio (32kbps Opus) + captions. Press
                        Stop when done.
                      </span>
                      <span className="fex-log">
                        <i aria-hidden="true" className="fex-dot-ora" />
                        Done - summary: <span className="fex-q">/app/calls/8f3k</span>
                      </span>
                    </div>

                    <div className="fex-actions">
                      <span className="fex-act fex-actrec">Record</span>
                      <span className="fex-act">Stop</span>
                      <span className="fex-act">Send</span>
                    </div>

                    <div className="fex-recent">
                      <p className="fex-rlabel">Recent calls</p>
                      <div className="fex-rrow">
                        <i aria-hidden="true" />
                        <span className="fex-rname">Acme × Gauge — Discovery</span>
                        <span className="fex-rmeta">score 82 · extension</span>
                      </div>
                    </div>
                  </div>

                  <div className="fex-divider" />
                  <div className="fex-srcrow">
                    <span className="fex-tok fex-tok-g">
                      <b aria-hidden="true" />
                      aria-live captions
                    </span>
                    <span className="fex-tok fex-tok-o">
                      <b aria-hidden="true" />
                      32kbps Opus
                    </span>
                    <span className="fex-tok fex-tok-d">0 bots in room</span>
                  </div>
                </div>
              </LiveDiv>
            </div>
          </div>
        </section>

        {/* INSTALL — obsidian band, three cards (fe-install artboard) */}
        <LiveSection id="install" className="fex-band fex-band-install">
          <div className="fex-grain" aria-hidden="true" />
          <div className="fex-inner">
            <p className="fex-eyebrow">Install</p>
            <h2 className="fex-h2">
              Install in three steps.
              <br />
              <span className="fex-soft">No store visit.</span>
            </h2>
            <p className="fex-sub">
              chrome://extensions · developer mode · session-memory key
            </p>

            <div className="fex-trio">
              {/* 01 — download and unzip */}
              <article className="fex-pcard">
                <div className="fex-prole">
                  <span className="fex-stepn">
                    <b>STEP 1</b> · files out
                  </span>
                  <span className="fex-ftag">v1.0.0</span>
                </div>
                <div
                  className="fex-scene"
                  role="img"
                  aria-label="The extension zip extracting into a folder with three real files"
                >
                  <div className="fex-sbody">
                    <div className="fex-ziprow">
                      <span className="fex-ztile">
                        <i aria-hidden="true">ZIP</i>
                        gauge-extension-1.0.0.zip
                      </span>
                      <div className="fex-folder">
                        <div className="fex-fhead">
                          <i aria-hidden="true" />
                          unzipped
                        </div>
                        <div className="fex-frow">
                          <s aria-hidden="true" />
                          manifest.json
                          <span className="fex-ftag">MV3</span>
                        </div>
                        <div className="fex-frow fex-frowjs">
                          <s aria-hidden="true" />
                          sidepanel.js
                          <span className="fex-ftag">REC</span>
                        </div>
                        <div className="fex-frow fex-frowjs">
                          <s aria-hidden="true" />
                          content.js
                          <span className="fex-ftag">SCRAPER</span>
                        </div>
                      </div>
                    </div>
                    <div className="fex-splitline" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="fex-ttl">Download &amp; Unzip</h3>
                <p className="fex-subline">
                  The archive carries the MV3 manifest, the sidepanel recorder,
                  and the caption scraper. <b>Nothing phones home.</b>
                </p>
                <a
                  className="fex-scrollink"
                  href="/gauge-extension-1.0.0.zip"
                  download="gauge-extension-1.0.0.zip"
                >
                  Download v1.0.0 (.zip)
                </a>
              </article>

              {/* 02 — load unpacked */}
              <article className="fex-pcard" id="store-pending">
                <div className="fex-prole">
                  <span className="fex-stepn">
                    <b>STEP 2</b> · unpacked
                  </span>
                  <span className="fex-ftag">chromium</span>
                </div>
                <div
                  className="fex-scene"
                  role="img"
                  aria-label="chrome://extensions with Developer mode on and Load unpacked waiting for a folder"
                >
                  <div className="fex-sbody">
                    <div className="fex-urlbar">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#8b8f9a"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                      </svg>
                      <span>chrome://extensions</span>
                      <span className="fex-urllock">built-in</span>
                    </div>
                    <div className="fex-devrow">
                      <span className="fex-devlabel">Developer mode</span>
                      <span className="fex-toggle">
                        <u>ON</u>
                      </span>
                    </div>
                    <div className="fex-loadrow">
                      <span className="fex-loadchip">
                        <i aria-hidden="true" />
                        Load unpacked
                      </span>
                      <span className="fex-loadmark">folder picker</span>
                    </div>
                  </div>
                </div>
                <h3 className="fex-ttl">Load unpacked in Chrome</h3>
                <p className="fex-subline">
                  Toggle <b>Developer mode</b>, point{" "}
                  <code>Load unpacked</code> at the unzipped folder. Works on
                  Chrome, Brave, Arc, Edge.
                </p>
              </article>

              {/* 03 — key in */}
              <article className="fex-pcard">
                <div className="fex-prole">
                  <span className="fex-stepn">
                    <b>STEP 3</b> · key in
                  </span>
                  <span className="fex-ftag">session only</span>
                </div>
                <div
                  className="fex-scene"
                  role="img"
                  aria-label="The side panel saving an API key — verdict line confirms session memory storage"
                >
                  <div className="fex-sbody">
                    <div className="fex-keyrow">
                      <span className="fex-keychip">cn_live_…</span>
                      <span className="fex-savebtn">
                        Save<s aria-hidden="true" />
                      </span>
                    </div>
                    <div className="fex-verdict">
                      <i aria-hidden="true" />
                      <span>Key saved · session memory only.</span>
                    </div>
                    <div className="fex-paneledge">
                      <b aria-hidden="true" />
                      side panel
                      <span className="fex-arrow" aria-hidden="true" />
                      <span>gauge account</span>
                    </div>
                  </div>
                </div>
                <h3 className="fex-ttl">Connect &amp; Record</h3>
                <p className="fex-subline">
                  Paste a key or auto-connect the account, then hit{" "}
                  <b>Record</b>. The panel reads captions —{" "}
                  <b>no bot joins the room.</b>
                </p>
                <Link className="fex-scrollink" href="/extension/connect">
                  Check connection status →
                </Link>
              </article>
            </div>
          </div>
        </LiveSection>

        {/* DEMO — obsidian band, six plates (fe-demo artboard) */}
        <LiveSection id="demo" className="fex-band fex-band-demo">
          <div className="fex-grain" aria-hidden="true" />
          <div className="fex-inner">
            <div className="fex-head">
              <p className="fex-eyebrow">Demo script</p>
              <h2 className="fex-h2">
                The 60-second demo.
                <br />
                <span className="fex-soft">Four buttons. Watch them stack.</span>
              </h2>
              <p className="fex-sub">
                Every label below is verbatim from the side panel
              </p>
            </div>

            <div className="fex-vocab">
              <span className="fex-vtok fex-vtok-hot">Record</span>
              <span className="fex-vsep" aria-hidden="true">·</span>
              <span className="fex-vtok">Stop</span>
              <span className="fex-vsep" aria-hidden="true">·</span>
              <span className="fex-vtok">Send</span>
              <span className="fex-vsep" aria-hidden="true">·</span>
              <span className="fex-vtok">Recent calls</span>
              <span className="fex-vsep" aria-hidden="true">·</span>
              <span className="fex-vtok" style={{ color: "#6ee7b7" }}>
                32kbps opus
              </span>
            </div>

            <div className="fex-demogrid">
              {/* 01 — captions on */}
              <article className="fex-platec">
                <div className="fex-chead">
                  <span className="fex-stepn">
                    <b>STEP 01</b>
                  </span>
                  <span className="fex-scap">captions on</span>
                </div>
                <div
                  className="fex-scene"
                  role="img"
                  aria-label="A meeting tab with live captions running — the panel needs captions to hear"
                >
                  <div className="fex-sbody">
                    <div className="fex-caprow">
                      <span className="fex-cc">CC</span>
                      <span
                        className="fex-capline fex-capline-hot"
                        style={{ width: "58%" }}
                      />
                      <span className="fex-capline" style={{ width: "26%" }} />
                      <span className="fex-limelabel">live</span>
                    </div>
                    <div className="fex-caprow">
                      <span className="fex-cc" style={{ opacity: 0.45 }}>
                        CC
                      </span>
                      <span className="fex-capline" style={{ width: "44%" }} />
                      <span className="fex-capline" style={{ width: "34%" }} />
                      <span className="fex-limelabel">meet tab</span>
                    </div>
                    <div className="fex-caprow" style={{ borderStyle: "dashed" }}>
                      <span className="fex-limelabel" style={{ marginLeft: 0 }}>
                        tab title
                      </span>
                      <span className="fex-capline" style={{ width: "52%" }} />
                      <span className="fex-limelabel">call name</span>
                    </div>
                  </div>
                </div>
                <p className="fex-ttl-plate">Open a meeting tab with captions on</p>
                <p className="fex-tline">
                  <b>Record</b> waits — captions off means nothing to read
                </p>
              </article>

              {/* 02 — key in */}
              <article className="fex-platec">
                <div className="fex-chead">
                  <span className="fex-stepn">
                    <b>STEP 02</b>
                  </span>
                  <span className="fex-scap">key in</span>
                </div>
                <div
                  className="fex-scene"
                  role="img"
                  aria-label="A cn_test key pasted and saved — held in session memory only"
                >
                  <div className="fex-sbody">
                    <div className="fex-keyrow">
                      <span className="fex-keychip">cn_test_…</span>
                      <span className="fex-savebtn">
                        Save<s aria-hidden="true" />
                      </span>
                    </div>
                    <div className="fex-verdict">
                      <i aria-hidden="true" />
                      <span>Key saved · session memory only.</span>
                    </div>
                  </div>
                </div>
                <p className="fex-ttl-plate">Paste your key and press Save</p>
                <p className="fex-tline">
                  <b>cn_live_</b> or <b>cn_test_</b> — never touches disk
                </p>
              </article>

              {/* 03 — record */}
              <article className="fex-platec">
                <div className="fex-chead">
                  <span className="fex-stepn">
                    <b>STEP 03</b>
                  </span>
                  <span className="fex-scap">record</span>
                </div>
                <div
                  className="fex-scene"
                  role="img"
                  aria-label="REC pill at 14 seconds — tab audio at 32kbps Opus streaming, captions tracked"
                >
                  <div className="fex-sbody">
                    <div className="fex-recrow">
                      <span className="fex-recpill">
                        <i aria-hidden="true" />
                        REC 00:14
                      </span>
                      <div className="fex-instrument" aria-hidden="true">
                        <i style={{ height: "8px" }} />
                        <i className="fex-off" style={{ height: "12px" }} />
                        <i style={{ height: "16px" }} />
                        <i style={{ height: "9px" }} />
                        <i className="fex-off" style={{ height: "14px" }} />
                        <i style={{ height: "18px" }} />
                        <i style={{ height: "11px" }} />
                      </div>
                    </div>
                    <div className="fex-micex">
                      <span>tab audio · 32kbps opus</span>
                      <span className="fex-no">mic → never asked</span>
                    </div>
                  </div>
                </div>
                <p className="fex-ttl-plate">Press Record and talk</p>
                <p className="fex-tline">
                  <b>Record</b> pressed — capture starts on your click
                </p>
              </article>

              {/* 04 — stop, then send */}
              <article className="fex-platec">
                <div className="fex-chead">
                  <span className="fex-stepn">
                    <b>STEP 04</b>
                  </span>
                  <span className="fex-scap">stop, then send</span>
                </div>
                <div
                  className="fex-scene"
                  role="img"
                  aria-label="Stop released the stream, Send hands the take over"
                >
                  <div className="fex-sbody">
                    <div className="fex-stoprow">
                      <span className="fex-spill">Stop</span>
                      <span className="fex-flowb" aria-hidden="true" />
                      <span className="fex-spill fex-spill-hot">Send</span>
                    </div>
                    <div className="fex-upchips">
                      <span className="fex-uchip">uploading audio</span>
                      <span className="fex-uchip">captions finalize</span>
                    </div>
                  </div>
                </div>
                <h3 className="fex-ttl-plate">Press Stop, then Send</h3>
                <p className="fex-tline">
                  stream released on stop · landed on send
                </p>
              </article>

              {/* 05 — done summary */}
              <article className="fex-platec">
                <div className="fex-chead">
                  <span className="fex-stepn">
                    <b>STEP 05</b>
                  </span>
                  <span className="fex-scap">done summary</span>
                </div>
                <div
                  className="fex-scene"
                  role="img"
                  aria-label="Done summary line with a call-page link, echoed by a Recent calls row"
                >
                  <div className="fex-sbody">
                    <span className="fex-stline fex-dm">
                      <i aria-hidden="true" />
                      Stopped. Uploading audio + finalizing captions…
                    </span>
                    <div className="fex-doneline">
                      <i aria-hidden="true" />
                      <span>Done - summary: /app/calls/8f3k</span>
                      <u>GET /api/v1/calls</u>
                    </div>
                    <div
                      className="fex-doneline"
                      style={{
                        background: "rgba(255,255,255,.02)",
                        borderColor: "rgba(255,255,255,.07)",
                      }}
                    >
                      <i
                        aria-hidden="true"
                        style={{ background: "#5b6270", boxShadow: "none" }}
                      />
                      <span style={{ color: "#8b8f9a" }}>
                        Acme × Gauge — Discovery
                      </span>
                      <u style={{ color: "#6ee7b7" }}>score 82</u>
                    </div>
                  </div>
                </div>
                <p className="fex-ttl-plate">Open the Done summary</p>
                <p className="fex-tline">
                  <b>Recent calls</b> deep-links the call · health score inline
                </p>
              </article>

              {/* 06 — slack digest */}
              <article className="fex-platec">
                <div className="fex-chead">
                  <span className="fex-stepn">
                    <b>STEP 06</b>
                  </span>
                  <span className="fex-scap">slack digest</span>
                </div>
                <div
                  className="fex-scene"
                  role="img"
                  aria-label="Slack digest posted with summary and health score to a sales channel"
                >
                  <div className="fex-sbody">
                    <div className="fex-digest">
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="8.9" y="2" width="3" height="9.4" rx="1.5" fill="#36C5F0" />
                        <rect x="12.6" y="12.6" width="9.4" height="3" rx="1.5" fill="#2EB67D" />
                        <rect x="12.1" y="12.6" width="3" height="9.4" rx="1.5" fill="#ECB22E" />
                        <rect x="2" y="8.4" width="9.4" height="3" rx="1.5" fill="#E01E5A" />
                      </svg>
                      <p>#sales · digest sent</p>
                      <b>HEALTH SCORE 82</b>
                    </div>
                    <span className="fex-stline fex-dm">
                      <i aria-hidden="true" />
                      Same summary the dashboard holds — forward without opening
                      it.
                    </span>
                  </div>
                </div>
                <p className="fex-ttl-plate">Share the digest</p>
                <p className="fex-tline">
                  outcome visible to the whole team
                </p>
              </article>
            </div>
          </div>
        </LiveSection>

        {/* TRUTH — obsidian band, scope scene + real table (fe-truth artboard) */}
        <LiveSection id="truth" className="fex-band fex-band-truth">
          <div className="fex-grain" aria-hidden="true" />
          <div className="fex-inner">
            <p className="fex-eyebrow">Permissions</p>
            <h2 className="fex-h2">
              What the extension can see.
              <br />
              <span className="fex-soft">Two brackets drawn on the tab.</span>
            </h2>
            <p className="fex-subplain">
              The scraper reads only live-caption regions and the tab title on
              meeting pages. Capture starts on your Record click and the
              stream is released on Stop.
            </p>

            <div className="fex-duo">
              {/* left: scope scene */}
              <div className="fex-maj">
                <div
                  className="fex-win"
                  role="img"
                  aria-label="Meeting window with two bracketed regions — the aria-live captions and the tab title; everything else shielded"
                >
                  <div className="fex-winhead">
                    <span className="fex-wdot" style={{ background: "#ff5f57" }} />
                    <span className="fex-wdot" style={{ background: "#febc2e" }} />
                    <span className="fex-wdot" style={{ background: "#28c840" }} />
                    <span className="fex-wtitle">Meet — Acme × Gauge Weekly</span>
                    <span className="fex-wscope">view from gauge · extension</span>
                  </div>
                  <div className="fex-winbody">
                    <div className="fex-capzone">
                      <span className="fex-ztag">Reads · aria-live region</span>
                      <div className="fex-capl" style={{ width: "74%" }} />
                      <div className="fex-capl fex-capl-b" />
                      <div className="fex-capl" style={{ width: "52%" }} />
                      <div className="fex-capl" style={{ width: "40%" }} />
                    </div>
                    <div className="fex-titlerow">
                      <span className="fex-tbrackets">
                        Tab title → <b>call name</b>
                      </span>
                      <span className="fex-tmeta">second read</span>
                    </div>
                    <div className="fex-shieldrow">
                      <div className="fex-shield">
                        <i aria-hidden="true" />
                        <span>mic</span>
                      </div>
                      <div className="fex-shield">
                        <i aria-hidden="true" />
                        <span>camera</span>
                      </div>
                      <div className="fex-shield">
                        <i aria-hidden="true" />
                        <span>other tabs</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="fex-recfoot">
                  <i aria-hidden="true" />
                  <span>
                    Between record and stop only — bracket closes on stop
                  </span>
                </div>
              </div>

              {/* right: the real capture-scope table */}
              <div className="fex-maj fex-truthcard">
                <table className="fex-table">
                  <caption className="sr-only">
                    Capture scope — what the side panel reads and what it
                    never touches
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className="fex-tcol fex-tcol-y">
                        Captures
                      </th>
                      <th scope="col" className="fex-tcol fex-tcol-n">
                        Never captures
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <p className="fex-ty">
                          Live caption text from aria-live regions (Meet,
                          Teams, Zoom)
                        </p>
                      </td>
                      <td>
                        <p className="fex-tn">
                          Anything before you press Record — capture never
                          auto-starts
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p className="fex-ty">
                          Meeting-tab audio at 32kbps Opus, Record → Stop only
                        </p>
                      </td>
                      <td>
                        <p className="fex-tn">
                          Microphone input directly — no mic permission
                          requested
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p className="fex-ty">
                          Meeting title from the tab title, used as the call
                          name
                        </p>
                      </td>
                      <td>
                        <p className="fex-tn">Camera, video, or screen content</p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p className="fex-ty">
                          Caption buffer in local storage — a closed tab never
                          loses captions
                        </p>
                      </td>
                      <td>
                        <p className="fex-tn">Other tabs or browsing history</p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p className="fex-ty">Bearer API key in session memory only</p>
                      </td>
                      <td>
                        <p className="fex-tn">Google account, contacts, or email</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="fex-tfoot">
                  Full disclosure →{" "}
                  <Link href="/privacy" className="fex-tflink">
                    privacy policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </LiveSection>

        {/* FIX — obsidian band, log still + five cards (fe-fix artboard) */}
        <LiveSection id="fix" className="fex-band fex-band-fix">
          <div className="fex-grain" aria-hidden="true" />
          <div className="fex-inner">
            <div className="fex-headrow">
              <div>
                <p className="fex-eyebrow">Troubleshooting</p>
                <h2 className="fex-h2">
                  When something looks wrong.
                  <br />
                  <span className="fex-soft">Five fixes, five real codes.</span>
                </h2>
                <p className="fex-sub">
                  The panel says one of these five — match the chip, take the
                  fix
                </p>
              </div>
              <div
                className="fex-logstill"
                role="img"
                aria-label="The panel status log — its five real messages, one per state"
              >
                <div className="fex-loghead">
                  <i aria-hidden="true" />
                  <span>Side panel · status log</span>
                  <b>all five, verbatim</b>
                </div>
                <div className="fex-logrows">
                  <div className="fex-lrow">
                    <i aria-hidden="true" className="fex-dot-amb" />
                    <span>Open a Meet / Teams / Zoom tab, then press Record.</span>
                    <u>IDLE</u>
                  </div>
                  <div className="fex-lrow">
                    <i aria-hidden="true" className="fex-dot-em" />
                    <span>Key saved · session memory only.</span>
                    <u>READY</u>
                  </div>
                  <div className="fex-lrow">
                    <i aria-hidden="true" className="fex-dot-red" />
                    <span>Recording tab audio (32kbps Opus) + captions.…</span>
                    <u>LIVE</u>
                  </div>
                  <div className="fex-lrow">
                    <i aria-hidden="true" className="fex-dot-ora" />
                    <span>Stopped. Uploading audio + finalizing captions…</span>
                    <u>TRANSIT</u>
                  </div>
                  <div className="fex-lrow">
                    <i aria-hidden="true" className="fex-dot-em" />
                    <span>Done - summary: /app/calls/8f3k</span>
                    <u>LANDED</u>
                  </div>
                </div>
              </div>
            </div>

            <div className="fex-fixgrid">
              {/* 1 */}
              <article className="fex-fixc">
                <span className="fex-chipcode fex-chipcode-amb">
                  <i aria-hidden="true" />
                  cc off
                </span>
                <h3>No captions are captured</h3>
                <p className="fex-fx">
                  Captions are off on the call tab. The panel reads only{" "}
                  <b>aria-live caption regions</b> — turn <b>CC on</b> and the
                  log starts moving.
                </p>
              </article>

              {/* 2 */}
              <article className="fex-fixc">
                <span className="fex-chipcode fex-chipcode-ora">
                  <i aria-hidden="true" />
                  HTTP 413
                </span>
                <h3>Upload fails with 413</h3>
                <p className="fex-fx">
                  The take is over your plan&apos;s server-side cap. Record a
                  shorter segment, or upgrade, then press <b>Send</b> again.
                </p>
                <div className="fex-caps">
                  <span className="fex-capm">Free 30MB</span>
                  <span className="fex-capm fex-capm-hot">Pro 200MB</span>
                  <span className="fex-capm fex-capm-hot">Business 500MB</span>
                </div>
              </article>

              {/* 3 */}
              <article className="fex-fixc">
                <span className="fex-chipcode fex-chipcode-red">
                  <i aria-hidden="true" />
                  HTTP 401 · 403
                </span>
                <h3>Key rejected with 401 or 403</h3>
                <p className="fex-fx">
                  &ldquo;Key rejected (401/403).&rdquo; Mint fresh via{" "}
                  <code>POST /api/v1/keys/exchange</code> or from{" "}
                  <Link href="/settings?tab=api-keys">Settings → API Keys</Link>
                  , paste, press <b>Save</b>.
                </p>
              </article>

              {/* 4 */}
              <article className="fex-fixc">
                <span className="fex-chipcode fex-chipcode-ind">
                  <i aria-hidden="true" />
                  bots api
                </span>
                <h3>Should I use a meeting bot instead?</h3>
                <p className="fex-fx">
                  In the room? Use the panel. Call you can&apos;t join — or
                  with no captions — dispatch a bot via{" "}
                  <code>POST /api/v1/bots</code>. Same dashboard, same call
                  pages.
                </p>
              </article>

              {/* 5 */}
              <article className="fex-fixc fex-fixc-wide">
                <span className="fex-chipcode fex-chipcode-neu">
                  <i aria-hidden="true" />
                  manual upload
                </span>
                <h3>Automatic upload is unavailable</h3>
                <p className="fex-fx">
                  Press <b>Stop</b>, save the captured audio locally, upload by
                  hand at <Link href="/app/record">/app/record</Link>. Your
                  captions persist — nothing lost.
                </p>
              </article>
            </div>
          </div>
        </LiveSection>

        {/* CTA — light section, breathing rec-orb island (fe-cta artboard) */}
        <section className="bg-[#EFEFEF] pt-8 sm:pt-12 pb-16 sm:pb-20 lg:pb-28">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
            <div className="doppel-outer">
              <div className="doppel-inner p-8 sm:p-12 lg:p-16">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-14 items-center">
                  <div className="text-center lg:text-left">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-4">
                      One more thing
                    </p>
                    <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3 text-gray-900">
                      Press Record on your next call.
                    </h2>
                    <p className="text-gray-500 mb-8 text-[14px] max-w-xl lg:max-w-md mx-auto lg:mx-0">
                      Same Gauge account. Recent calls, health scores, and the
                      Slack digest work the moment your key is saved.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                      <Link
                        href="/app/record"
                        className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2"
                      >
                        <span>Open the manual fallback</span>
                        <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
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
                  <LiveDiv className="w-full lg:w-[540px]">
                    <div className="fex-island-cta">
                      <p className="fex-ctameta">
                        <span>
                          <b>Record</b> · next call
                        </span>
                        <span>same gauge account</span>
                      </p>
                      <div
                        className="fex-orbwrap"
                        role="img"
                        aria-label="A breathing record button ringed by the three promises the account already tracks"
                      >
                        <div className="fex-breathe" aria-hidden="true" />
                        <div className="fex-ring" aria-hidden="true" />
                        <div className="fex-ring fex-ring2" aria-hidden="true" />
                        <div className="fex-core">
                          <span>REC</span>
                        </div>
                      </div>
                      <div className="fex-chips">
                        <span className="fex-chip">
                          <b aria-hidden="true" />
                          Recent calls
                        </span>
                        <span className="fex-chip fex-chip-hot">
                          <b aria-hidden="true" />
                          Health scores
                        </span>
                        <span className="fex-chip">
                          <b aria-hidden="true" />
                          Slack digest
                        </span>
                      </div>
                      <p className="fex-foot">Works the moment your key is saved</p>
                    </div>
                  </LiveDiv>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
