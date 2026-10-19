"use client";

import Link from "next/link";
import { ArrowRight, Globe, Database } from "lucide-react";


export function StudioProductArchitecture() {
  return (
    <section
      data-track-section="product-architecture"
      aria-label="Product Architecture: Extension vs Web Hub"
      className="py-16 sm:py-20 lg:py-24 bg-[#F8F9FA] border-b border-black/[0.05] overflow-hidden"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="text-[12px] font-mono uppercase tracking-[0.18em] text-[#F26522] font-semibold mb-3">
            Two Sides of One Revenue Engine
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-medium tracking-[-0.03em] text-gray-900 leading-[1.1] mb-3 text-balance">
            The extension on your call. The web hub for your team.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Sales reps capture meetings with 0 bots directly in the browser. Revenue leaders track competitor trends and deal pipeline across the entire team in the web dashboard.
          </p>
        </div>

        {/* ── 2-Column Split: Extension vs Web App ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 sm:gap-8 items-stretch">
          {/* ── COLUMN 1: THE EXTENSION (IN-CALL WEAPON) ── */}
          <div className="rounded-2xl p-7 sm:p-9 bg-white border border-black/[0.07] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
            <div>
              {/* Top Tag & Pill */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full font-semibold">
                  Primary Product · For Reps
                </span>
                <span className="text-[11px] font-mono text-gray-400">Chrome Extension (MV3)</span>
              </div>

              {/* Title & Description */}
              <h3 className="text-[23px] sm:text-[26px] font-bold tracking-tight text-gray-900 mb-2">
                The In-Call Weapon: Chrome Extension
              </h3>
              <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
                Lives inside Google Meet, Zoom, and Teams. Captures audio directly from the tab with <strong>zero bots invited</strong>, surfaces live competitor battlecards on screen, and pushes notes to your CRM when you press Send.
              </p>

              {/* High-Fidelity 3D Render */}
              <div className="rounded-xl overflow-hidden border border-black/[0.08] shadow-md mb-6 relative group/img bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/studio/gauge_hero_3d_mockup.jpg"
                  alt="Gauge Chrome extension 3D product render showing live battlecard pop-up on a sales call"
                  className="w-full object-cover object-center group-hover/img:scale-[1.02] transition-transform duration-500"
                  style={{ height: "260px" }}
                  loading="lazy"
                />
                {/* Frosted Telemetry Pill */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>0 Bots Active</span>
                </div>
              </div>

              {/* Stat Pills */}
              <div className="flex items-center gap-2.5 flex-wrap mb-6">
                <span className="flex items-center gap-1.5 text-[11.5px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-3 py-1 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  0 Bots in Call
                </span>
                <span className="text-[11.5px] font-mono text-gray-600 bg-neutral-100 border border-black/[0.06] px-3 py-1 rounded-full">
                  Battlecard in 2.1s
                </span>
                <span className="text-[11.5px] font-mono text-gray-600 bg-neutral-100 border border-black/[0.06] px-3 py-1 rounded-full">
                  CRM Sync in 60s
                </span>
              </div>
            </div>

            {/* Bottom Button */}
            <Link
              href="/extension"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#F26522] hover:bg-[#e05a1a] text-white transition-all text-[13.5px] font-semibold w-full shadow-md shadow-[#F26522]/20"
            >
              <Globe size={15} />
              <span>Install Chrome Extension</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* ── COLUMN 2: THE WEB APP HUB (TEAM INTELLIGENCE) ── */}
          <div className="rounded-2xl p-7 sm:p-9 bg-white border border-black/[0.07] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
            <div>
              {/* Top Tag & Pill */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-blue-800 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full font-semibold">
                  Intelligence Hub · For Teams
                </span>
                <span className="text-[11px] font-mono text-gray-400">Web App &amp; Database</span>
              </div>

              {/* Title & Description */}
              <h3 className="text-[23px] sm:text-[26px] font-bold tracking-tight text-gray-900 mb-2">
                The Revenue Hub: Web Dashboard
              </h3>
              <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
                Your company&apos;s central call database. View team competitive mention trends, track pipeline risks, query calls with AI, and manage bi-directional sync to HubSpot, Salesforce, and Slack.
              </p>

              {/* High-Fidelity Vector Dashboard Visual */}
              <div className="rounded-xl overflow-hidden border border-black/[0.08] shadow-md mb-6 relative group/img bg-[#0A0A0B]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/product/radar-board.svg"
                  alt="Gauge central web hub and competitive intelligence radar board"
                  className="w-full object-cover object-top group-hover/img:scale-[1.02] transition-transform duration-500"
                  style={{ height: "260px" }}
                  loading="lazy"
                />
                {/* Frosted Telemetry Pill */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F26522] animate-pulse" />
                  <span>Live Radar Sync</span>
                </div>
              </div>

              {/* Stat Pills */}
              <div className="flex items-center gap-2.5 flex-wrap mb-6">
                <span className="flex items-center gap-1.5 text-[11.5px] font-mono text-blue-800 bg-blue-50 border border-blue-200/70 px-3 py-1 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  48 Calls Analyzed
                </span>
                <span className="text-[11.5px] font-mono text-gray-600 bg-neutral-100 border border-black/[0.06] px-3 py-1 rounded-full">
                  Competitor Radar
                </span>
                <span className="text-[11.5px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1 rounded-full font-medium">
                  Auto CRM Hygiene
                </span>
              </div>
            </div>

            {/* Bottom Button */}
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gray-950 hover:bg-black text-white transition-all text-[13.5px] font-semibold w-full shadow-sm"
            >
              <Database size={15} />
              <span>Try Interactive Web Sandbox</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
