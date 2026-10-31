"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { ArrowRight, Globe, Database } from "lucide-react";

// Intrinsic width of the fixed pd-stage coordinate systems (px).
// The stage is uniformly scaled down via --pd-s on narrow containers.
const STAGE_W = 520;

// Waveform bar heights (px). Bars ≥54px get the orange "hot" gradient —
// designed as one graphic moment, not a data table.
const WAVE: readonly number[] = [
  20, 38, 54, 28, 60, 34, 22, 64, 40, 26, 56, 30, 48, 24, 62, 36, 20, 50, 32, 58,
  26, 44, 18, 60, 34, 24, 54, 28, 46, 22, 64, 38, 26, 58, 18, 48, 30, 56, 24, 40,
];

const stageVars = (h: number, d: number) =>
  ({ "--h": `${h}px`, "--d": `${d}s` }) as CSSProperties;

export function StudioProductArchitecture() {
  const secRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return;

    // Ambient loop only runs while the section is on screen.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        sec.dataset.live = visible ? "true" : "false";
      },
      { threshold: 0.12 }
    );
    io.observe(sec);

    // Uniformly scale the fixed 520px stages to fit their plate.
    const ro = new ResizeObserver(() => {
      const zone = sec.querySelector<HTMLElement>(".pd-stage");
      if (!zone) return;
      const w = zone.clientWidth;
      if (w > 0) sec.style.setProperty("--pd-s", String(Math.min(1, w / STAGE_W)));
    });
    ro.observe(sec);

    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <section
      ref={secRef}
      data-track-section="product-architecture"
      data-live="false"
      aria-label="Product Architecture: Extension vs Web Hub"
      className="pd-sec overflow-hidden border-b border-white/[0.06] py-16 sm:py-20 lg:py-24"
    >
      <div
        className="pd-grain"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-10">
        {/* ── Section Header ── */}
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <p className="mb-4 text-[12px] font-mono font-semibold uppercase tracking-[0.18em] text-[#F26522]">
            Two Sides of One Revenue Engine
          </p>
          <h2 className="mb-4 text-balance text-[clamp(2rem,4vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.03em] text-[#F4F4F6]">
            The extension on your call.{" "}
            <span className="text-[#7D818C]">The web hub for your team.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-[15px] leading-relaxed text-[#9A9EA8] sm:text-[16px]">
            Sales reps capture meetings with 0 bots directly in the browser. Revenue leaders track competitor trends and deal pipeline across the entire team in the web dashboard.
          </p>
        </div>

        {/* ── Engine split: extension plate → sync rail → hub plate ── */}
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1fr_118px_1fr]">
          {/* ── PLATE 1: THE IN-CALL WEAPON ── */}
          <article className="pd-plate">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="pd-role pd-role--grn">Primary Product · For Reps</span>
              <span className="pd-grademono">Chrome Extension (MV3)</span>
            </div>

            <h3 className="mb-2 text-[23px] font-semibold tracking-[-0.02em] text-[#F2F3F7] sm:text-[24px]">
              The In-Call Weapon: Chrome Extension
            </h3>
            <p className="mb-4 text-[13px] leading-[1.6] text-[#9A9EA8]">
              Lives inside Google Meet, Zoom, and Teams. Captures audio directly from the tab with{" "}
              <strong className="font-semibold text-[#D6D8E0]">zero bots invited</strong>, surfaces live
              competitor battlecards on screen, and pushes notes to your CRM when you press Send.
            </p>

            <div
              className="pd-stage"
              role="img"
              aria-label="Live call mockup: the Gauge extension listens to tab audio with zero bots and surfaces a battlecard for a Gong objection."
            >
              <div className="pd-stagein" aria-hidden="true">
                {/* Meet window — one big visual moment: waveform + battlecard */}
                <div className="pd-meet">
                  <div className="pd-meetbar">
                    <i className="pd-dot pd-dot--a" />
                    <i className="pd-dot pd-dot--b" />
                    <i className="pd-dot pd-dot--c" />
                  </div>
                  <div className="pd-wave">
                    {WAVE.map((h, i) => (
                      <i
                        key={i}
                        className={h >= 54 ? "hot" : undefined}
                        style={stageVars(h, i * 0.06)}
                      />
                    ))}
                  </div>
                  <div className="pd-zpill">
                    <b />
                    <span>0 Bots Active</span>
                  </div>
                  <div className="pd-rec">
                    <b />
                    <span>14:02</span>
                  </div>
                </div>

                {/* Holographic battlecard — GONG / objection / confidence */}
                <div className="pd-bcard">
                  <div className="pd-bc-head">GONG</div>
                  <div className="pd-bc-label">OBJECTION</div>
                  <div className="pd-bc-num">78%</div>
                  <div className="pd-bc-track">
                    <div className="pd-bc-fill" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pd-chips">
              <span className="pd-chip pd-chip--grn">
                <b />
                <span>0 Bots in Call</span>
              </span>
              <span className="pd-chip pd-chip--hot">
                <b />
                <span>Battlecard in 2.1s</span>
              </span>
              <span className="pd-chip">
                <b />
                <span>CRM Sync in 60s</span>
              </span>
            </div>

            <Link href="/extension" className="pd-cta pd-cta--orange">
              <Globe size={15} strokeWidth={2} />
              <span>Install Chrome Extension</span>
              <ArrowRight size={14} strokeWidth={2.4} />
            </Link>
          </article>

          {/* ── CENTER SYNC RAIL ── */}
          <div className="pd-rail" aria-hidden="true">
            <span className="pd-rchip">CAPTURE</span>
            <span className="pd-rline">
              <i className="pd-rdot" />
            </span>
            <span className="pd-rchip">ANALYZE</span>
            <span className="pd-rline">
              <i className="pd-rdot" style={{ animationDelay: "-1.4s" }} />
            </span>
            <span className="pd-rchip">PULSE TO TEAM</span>
            <p className="pd-rfoot">
              SYNC
              <br />
              CONTINUOUS
            </p>
          </div>

          {/* ── PLATE 2: THE REVENUE HUB ── */}
          <article className="pd-plate">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="pd-role pd-role--ind">Intelligence Hub · For Teams</span>
              <span className="pd-grademono">Web App &amp; Database</span>
            </div>

            <h3 className="mb-2 text-[23px] font-semibold tracking-[-0.02em] text-[#F2F3F7] sm:text-[24px]">
              The Revenue Hub: Web Dashboard
            </h3>
            <p className="mb-4 text-[13px] leading-[1.6] text-[#9A9EA8]">
              Your company&apos;s central call database. View team competitive mention trends, track
              pipeline risks, query calls with AI, and manage bi-directional sync to HubSpot,
              Salesforce, and Slack.
            </p>

            <div
              className="pd-stage"
              role="img"
              aria-label="Competitive intelligence radar mockup: Gong surfaces as the rival in the lead this week."
            >
              <div className="pd-stagein" aria-hidden="true">
                {/* Radar disc — the hero graphic */}
                <div className="pd-disc">
                  <svg viewBox="0 0 300 300" fill="none">
                    <circle cx="150" cy="150" r="56" stroke="rgba(255,255,255,0.10)" />
                    <circle cx="150" cy="150" r="104" stroke="rgba(255,255,255,0.08)" />
                    <circle cx="150" cy="150" r="140" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 6" />
                    <line x1="150" y1="10" x2="150" y2="290" stroke="rgba(255,255,255,0.05)" />
                    <line x1="10" y1="150" x2="290" y2="150" stroke="rgba(255,255,255,0.05)" />
                  </svg>
                  <div className="pd-sweep" />
                  <span className="pd-blip pd-blip--a">
                    <i className="pd-ring" />
                  </span>
                  <span className="pd-blip pd-blip--b">
                    <i className="pd-ring pd-ring--b" />
                  </span>
                  <span className="pd-blip pd-blip--c">
                    <i className="pd-ring pd-ring--c" />
                  </span>
                </div>

                {/* Mini mention bars — pure graphic, zero words */}
                <div className="pd-mini">
                  <i style={{ height: 38 }} />
                  <i style={{ height: 24 }} />
                  <i className="alt" style={{ height: 15 }} />
                  <i className="alt" style={{ height: 30 }} />
                  <i className="alt" style={{ height: 19 }} />
                  <i style={{ height: 44 }} />
                  <i style={{ height: 12 }} />
                </div>

                {/* Stat rail — two floating chips only */}
                <div className="pd-statrail">
                  <div className="pd-statcard pd-statcard--rival">
                    <div className="pd-statlabel pd-statlabel--hot">TOP RIVAL</div>
                    <div className="pd-statname">Gong</div>
                    <div className="pd-statdelta">+38%</div>
                  </div>
                  <div className="pd-statcard">
                    <div className="pd-statlabel">MENTIONS</div>
                    <div className="pd-statbig">127</div>
                  </div>
                  <span className="pd-livepill">
                    <b />
                    <span>LIVE</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pd-chips">
              <span className="pd-chip pd-chip--ind">
                <b />
                <span>48 Calls Analyzed</span>
              </span>
              <span className="pd-chip">
                <b />
                <span>Competitor Radar</span>
              </span>
              <span className="pd-chip pd-chip--hot">
                <b />
                <span>Auto CRM Hygiene</span>
              </span>
            </div>

            <Link href="/demo" className="pd-cta pd-cta--ghost">
              <Database size={15} strokeWidth={2} />
              <span>Try Interactive Web Sandbox</span>
              <ArrowRight size={14} strokeWidth={2.4} />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
