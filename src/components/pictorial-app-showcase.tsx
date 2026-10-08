"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Crosshair,
  Bot,
  CheckCircle2,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Volume2,
  Calendar,
  Share2,
} from "lucide-react";

const ACCENT = "#F26522";

export function PictorialAppShowcase() {
  const [activeTab, setActiveTab] = useState<"alert" | "nobot" | "crm">("alert");

  return (
    <section
      data-track-section="pictorial-showcase"
      aria-label="Interactive Product Preview"
      className="py-12 sm:py-16 bg-white border-b border-gray-200"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#F26522] bg-[#F26522]/10 border border-[#F26522]/20 px-3 py-1 rounded-full mb-3">
            <Sparkles size={12} />
            <span>Interactive product preview</span>
          </div>
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-medium tracking-[-0.03em] text-gray-900 leading-[1.12]">
            See Gauge in action. No fluff, just proof.
          </h2>
          <p className="mt-3 text-gray-600 text-[14px] sm:text-[15px] leading-relaxed">
            Click through the three moments that make Gauge different from standard notetakers.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "alert"}
            onClick={() => setActiveTab("alert")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all ${
              activeTab === "alert"
                ? "bg-gray-900 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200/80"
            }`}
          >
            <Crosshair size={15} className={activeTab === "alert" ? "text-[#F26522]" : ""} />
            <span>1. Instant Rival Alert in Slack</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "nobot"}
            onClick={() => setActiveTab("nobot")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all ${
              activeTab === "nobot"
                ? "bg-gray-900 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200/80"
            }`}
          >
            <ShieldCheck size={15} className={activeTab === "nobot" ? "text-emerald-500" : ""} />
            <span>2. Zero Bots in Your Call</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "crm"}
            onClick={() => setActiveTab("crm")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all ${
              activeTab === "crm"
                ? "bg-gray-900 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200/80"
            }`}
          >
            <FileText size={15} className={activeTab === "crm" ? "text-blue-500" : ""} />
            <span>3. 60-Second CRM Notes</span>
          </button>
        </div>

        {/* The Window Frame */}
        <div className="doppel-outer max-w-5xl mx-auto overflow-hidden">
          <div className="doppel-inner bg-[#121316] text-white overflow-hidden shadow-2xl">
            {/* Window Top Bar (macOS Style) */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#17181c]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block" />
                <span className="ml-3 font-mono text-[11px] text-white/50 hidden sm:inline">
                  Gauge Sales Intelligence Studio · Call #0492-ACME
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono text-emerald-400">Live Recording</span>
              </div>
            </div>

            {/* TAB 1: RIVAL ALERT IN SLACK */}
            {activeTab === "alert" && (
              <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left side: Call dialogue snippet */}
                <div className="lg:col-span-5 bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-white/50 mb-4 pb-2 border-b border-white/5">
                      <span>Transcript Feed</span>
                      <span>00:14:22</span>
                    </div>
                    <div className="space-y-4 text-[13px]">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white/90">Sarah Chen</span>
                          <span className="text-[10px] text-white/40 font-mono">VP Sales · Acme</span>
                        </div>
                        <p className="text-white/70 leading-relaxed pl-2 border-l-2 border-white/20">
                          &ldquo;We need automated call notes for our 50 SDRs, but we&apos;re currently also evaluating{" "}
                          <mark className="bg-[#F26522]/30 text-white font-semibold px-1 rounded border border-[#F26522]/50">
                            Gong and Chorus
                          </mark>{" "}
                          for the rollout.&rdquo;
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white/90">Alex R.</span>
                          <span className="text-[10px] text-[#F26522] font-mono">Account Exec</span>
                        </div>
                        <p className="text-white/60 leading-relaxed pl-2 border-l-2 border-[#F26522]">
                          &ldquo;Understood. Are you looking for their conversation intelligence dashboard, or strictly note-taking and CRM hygiene?&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/40">
                    <span className="flex items-center gap-1.5 text-[#F26522]">
                      <Crosshair size={12} /> Rival detected at 00:14:22
                    </span>
                    <span>Confidence: 0.96</span>
                  </div>
                </div>

                {/* Right side: Real Slack deal-room message */}
                <div className="lg:col-span-7 bg-[#1c1d22] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-inner">
                  <div>
                    {/* Slack Channel Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 font-bold text-sm">#</span>
                        <span className="text-white font-semibold text-sm">deal-room-acme</span>
                        <span className="text-[11px] text-white/40 font-mono hidden sm:inline">| 14 members</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded">
                        Slack Bot · 2:14 PM
                      </span>
                    </div>

                    {/* Slack Message Card */}
                    <div className="bg-[#121316] border-l-4 border-[#F26522] p-4 rounded-r-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded bg-[#F26522] flex items-center justify-center text-[10px] font-bold">
                          G
                        </span>
                        <span className="font-semibold text-white text-[13px]">Gauge Alert</span>
                        <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                          Competitor Detected
                        </span>
                      </div>
                      <p className="text-[13px] text-white font-medium mb-1">
                        Rival Named: <span className="text-[#F26522] font-bold">Gong (0.96)</span>
                      </p>
                      <blockquote className="text-[12.5px] text-white/80 italic bg-white/5 p-2.5 rounded-lg border border-white/5 my-2">
                        &ldquo;We&apos;re also evaluating Gong and Chorus for the rollout.&rdquo;
                      </blockquote>
                      <div className="text-[11.5px] text-white/60 mb-3">
                        Speaker: <span className="text-white">Sarah Chen</span> · Call:{" "}
                        <span className="text-white">Acme Corp Discovery</span> · Timestamp:{" "}
                        <span className="font-mono text-white">00:14:22</span>
                      </div>

                      {/* Battlecard Action Pill */}
                      <div className="bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-lg text-[12px] flex items-start gap-2">
                        <span className="text-[#F26522] font-bold">⚡ Battlecard:</span>
                        <span className="text-white/80">
                          Gong charges $1,400/rep/yr + $5k platform fee. Gauge is $9/mo flat with zero bots and instant notes.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Slack Interactive Buttons */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-[#F26522] text-white text-[12px] font-medium hover:bg-[#e05a1a] transition">
                      Push to Salesforce Opp →
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-[12px] font-medium hover:bg-white/20 transition">
                      Open Call Recording (0:14)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ZERO BOTS IN THE CALL */}
            {activeTab === "nobot" && (
              <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traditional Notetakers: The awkward bot */}
                <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-medium">
                        Other Notetakers (Otter, Fireflies)
                      </span>
                      <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-mono">
                        Awkward Meeting Bot
                      </span>
                    </div>

                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-white/70">
                        <div className="bg-white/5 p-3 rounded-lg flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center font-bold text-[10px]">SC</span>
                          <span>Sarah Chen (Prospect)</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-[10px]">AR</span>
                          <span>Alex R. (You)</span>
                        </div>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-center gap-2.5 text-[12px] text-red-200">
                        <Bot size={18} className="text-red-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-white">Notetaker Bot (Recording)</span>
                          <p className="text-[11px] text-red-300">Joined call at 00:00 · Visible to all</p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-[13px] text-white/70 leading-relaxed">
                      ❌ Prospects ask: <span className="italic text-white">&ldquo;Wait, who is recording this? Can you turn that off?&rdquo;</span> Enterprise security policies frequently block external bot access.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-red-400 font-mono">
                    High friction · Kills rapport · Blocked by IT
                  </div>
                </div>

                {/* Gauge: 100% Bot-Free Native Capture */}
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-medium">
                        Gauge Chrome Extension
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                        100% Bot-Free
                      </span>
                    </div>

                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-white/70">
                        <div className="bg-white/5 p-3 rounded-lg flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center font-bold text-[10px]">SC</span>
                          <span>Sarah Chen (Prospect)</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-[10px]">AR</span>
                          <span>Alex R. (You)</span>
                        </div>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg flex items-center justify-between text-[12px] text-emerald-200">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                          <span>Native Browser Audio Capture</span>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                          0 Bots in Room
                        </span>
                      </div>
                    </div>

                    <p className="mt-4 text-[13px] text-white/80 leading-relaxed">
                      ✅ <span className="font-semibold text-white">Zero bots ever join the call.</span> Gauge captures live meeting captions natively in your browser. Nothing joins your meeting link. Zero awkward pauses.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    <span>Works on Google Meet, Zoom web, & raw MP3 uploads</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: 60-SECOND CRM NOTES */}
            {activeTab === "crm" && (
              <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left side: Generated Summary */}
                <div className="lg:col-span-7 bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-[#F26522]" />
                        <span className="font-semibold text-white text-sm">Deal Summary & Action Items</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Generated in 48s
                      </span>
                    </div>

                    <div className="space-y-4 text-[13px]">
                      <div>
                        <h4 className="text-[11px] font-mono text-white/50 uppercase tracking-wider mb-1">
                          Executive Takeaway
                        </h4>
                        <p className="text-white/80 leading-relaxed">
                          Acme Corp evaluating automated notetakers for 50 SDRs. Primary pain point is ~5h/week lost to manual CRM entry. Decision expected Q3. Evaluating Gong concurrently.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-mono text-white/50 uppercase tracking-wider mb-2">
                          Action Items & Commitments
                        </h4>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5 text-[12px]">
                            <span className="w-4 h-4 rounded border border-emerald-400/50 flex items-center justify-center text-emerald-400 text-[10px]">
                              ✓
                            </span>
                            <span className="flex-1 text-white">Send procurement one-pager to Sarah</span>
                            <span className="font-mono text-[10px] text-white/50">Due THU</span>
                          </li>
                          <li className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5 text-[12px]">
                            <span className="w-4 h-4 rounded border border-emerald-400/50 flex items-center justify-center text-emerald-400 text-[10px]">
                              ✓
                            </span>
                            <span className="flex-1 text-white">Loop in procurement lead for pricing review</span>
                            <span className="font-mono text-[10px] text-white/50">Due FRI</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/40">
                    <span>Talk Ratio: Rep 58% · Prospect 42%</span>
                    <span className="text-emerald-400 font-semibold">Deal Health: 8.4/10</span>
                  </div>
                </div>

                {/* Right side: 1-Click CRM Sync */}
                <div className="lg:col-span-5 bg-[#17181d] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                        1-Click CRM Write-Back
                      </span>
                      <span className="text-[10px] bg-[#F26522]/20 text-[#F26522] px-2 py-0.5 rounded font-mono">
                        HubSpot + SFDC
                      </span>
                    </div>

                    <div className="space-y-3 text-[12px]">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white">HubSpot Deal Record</span>
                          <span className="text-[10px] text-emerald-400 font-mono">Synced</span>
                        </div>
                        <p className="text-white/60 text-[11px]">Deal: Acme Corp Expansion ($45k ARR)</p>
                        <p className="text-white/60 text-[11px]">Competitor__c: Gong</p>
                      </div>

                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white">Salesforce MEDDIC Fields</span>
                          <span className="text-[10px] text-emerald-400 font-mono">Synced</span>
                        </div>
                        <p className="text-white/60 text-[11px]">Economic Buyer: Sarah Chen</p>
                        <p className="text-white/60 text-[11px]">Decision Criteria: Flat pricing & privacy</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/10">
                    <Link
                      href="/sign-up"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] font-medium transition"
                    >
                      <span>Try it on your calls — free</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PictorialAppShowcase;
