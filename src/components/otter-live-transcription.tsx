"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Mic, Radio, MessageSquare, Tag, Check, Volume2 } from "lucide-react";

export function OtterLiveTranscription() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<"transcript" | "actions" | "battlecard">("transcript");
  const [seconds, setSeconds] = useState(14);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSeconds((s) => (s >= 25 ? 14 : s + 1));
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-[#FAFAFC] border-y border-black/[0.04] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#F26522] bg-[#F26522]/10 border border-[#F26522]/20 px-3.5 py-1 rounded-full mb-3.5">
            <Radio size={12} className="animate-pulse" />
            <span>Real-time voice intelligence</span>
          </div>
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-medium tracking-[-0.03em] text-gray-900 leading-[1.12]">
            See the words, as they&apos;re spoken.
          </h2>
          <p className="mt-3 text-gray-600 text-[14px] sm:text-[16px] leading-relaxed max-w-xl mx-auto">
            Live transcription with speaker recognition, real-time competitor detection, and instant AI deal signals.
          </p>
        </div>

        {/* Live Audio & Transcript Sandbox Card */}
        <div className="max-w-4xl mx-auto doppel-outer">
          <div className="doppel-inner bg-white overflow-hidden">
            {/* Top Bar with Live Indicator & Mode Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-neutral-50/70">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200/60 text-red-600 text-[11px] font-mono font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  LIVE CAPTURE
                </span>
                <span className="text-[12px] text-gray-500 font-mono hidden sm:inline">
                  Google Meet · Acme Corp Discovery
                </span>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-gray-200/60 p-1 rounded-full text-[12px] font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab("transcript")}
                  className={`px-3.5 py-1 rounded-full transition-all ${
                    activeTab === "transcript"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Live Transcript
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("actions")}
                  className={`px-3.5 py-1 rounded-full transition-all ${
                    activeTab === "actions"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Action Items (3)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("battlecard")}
                  className={`px-3.5 py-1 rounded-full transition-all ${
                    activeTab === "battlecard"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Battlecard 🔥
                </button>
              </div>
            </div>

            {/* Main Interactive Screen Content */}
            <div className="p-6 sm:p-8 min-h-[320px] flex flex-col justify-between">
              {activeTab === "transcript" && (
                <div className="space-y-6">
                  {/* Speaker 1 */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F26522] text-white flex items-center justify-center text-[12px] font-bold shadow-sm shrink-0">
                      SC
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-[14px]">Sarah Chen</span>
                        <span className="text-[11px] text-gray-500">VP Sales · Acme Corp</span>
                        <span className="text-[11px] font-mono text-gray-400">00:14:18</span>
                      </div>
                      <p className="text-[15px] text-gray-700 leading-relaxed">
                        We are also evaluating{" "}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F26522]/15 text-[#F26522] font-semibold border border-[#F26522]/30 shadow-xs">
                          <Tag size={11} /> Gong and Chorus
                        </span>{" "}
                        for conversation intelligence across our 50 enterprise SDRs.
                      </p>
                      <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
                        <span>Rival Mention Detected (0.96) → Pushed to #deal-room-acme</span>
                      </div>
                    </div>
                  </div>

                  {/* Speaker 2 */}
                  <div className="flex items-start gap-4 pt-2">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 text-white flex items-center justify-center text-[12px] font-bold shadow-sm shrink-0">
                      MK
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-[14px]">Maya Kim</span>
                        <span className="text-[11px] text-gray-500">Account Exec · Gauge</span>
                        <span className="text-[11px] font-mono text-gray-400">00:14:{seconds}</span>
                      </div>
                      <p className="text-[15px] text-gray-800 leading-relaxed">
                        Understood. Unlike traditional tools, Gauge runs completely bot-free so your clients never feel recorded, and you get real-time battlecards right in Slack
                        <span className="inline-block w-2 h-4 bg-[#F26522] ml-1.5 animate-pulse align-middle" />
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "actions" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-neutral-50 hover:bg-neutral-100/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
                        <Check size={13} />
                      </div>
                      <span className="text-[14px] text-gray-800 font-medium">Send Gong vs Gauge pricing comparison one-pager</span>
                    </div>
                    <span className="text-[11px] font-mono text-gray-500">Owner: Maya Kim · Due Friday</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-neutral-50 hover:bg-neutral-100/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
                        <Check size={13} />
                      </div>
                      <span className="text-[14px] text-gray-800 font-medium">Confirm 50-seat SDR pilot scope & timeline</span>
                    </div>
                    <span className="text-[11px] font-mono text-gray-500">Owner: Sarah Chen · Next Call</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-neutral-50 hover:bg-neutral-100/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                        <MessageSquare size={13} />
                      </div>
                      <span className="text-[14px] text-gray-800 font-medium">Push follow-up draft directly to HubSpot CRM</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600 font-semibold">1-Click Ready</span>
                  </div>
                </div>
              )}

              {activeTab === "battlecard" && (
                <div className="p-4 rounded-xl border border-[#F26522]/20 bg-[#FFF7F3] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#F26522] text-white text-[11px] font-bold">
                        BATTLECARD
                      </span>
                      <span className="text-[13px] font-bold text-gray-900">Gong & Chorus Counter-Pitch</span>
                    </div>
                    <span className="text-[11px] font-mono text-gray-500">Auto-suggested for Maya</span>
                  </div>
                  <p className="text-[13px] text-gray-700 leading-relaxed">
                    <strong>Key Differentiator:</strong> Gong charges \$1,400/rep/yr plus expensive platform fees and requires intrusive bots in calls. Gauge costs \$9/mo flat, runs bot-free via Chrome extension, and pings instant quotes directly into Slack.
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[12px] font-medium text-[#F26522]">
                    <span>✓ Shared to #deal-room-acme</span>
                    <span>·</span>
                    <span>✓ 100% Rep Confidence</span>
                  </div>
                </div>
              )}

              {/* Floating Audio Controller Bar (Otter Style) */}
              <div className="mt-8 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? "Pause audio" : "Play audio"}
                    className="w-10 h-10 rounded-full bg-gray-900 hover:bg-[#F26522] text-white flex items-center justify-center transition-colors shadow-sm"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-gray-400" />
                    <span className="text-[12px] font-mono text-gray-600">
                      00:{seconds < 10 ? `0${seconds}` : seconds} / 32:40
                    </span>
                  </div>
                </div>

                {/* Animated Audio Equalizer Waveform */}
                <div className="flex-1 max-w-xs h-7 flex items-center gap-1 px-3 bg-neutral-100/80 rounded-full">
                  {[30, 60, 45, 80, 100, 75, 40, 90, 60, 30, 85, 95, 50, 70, 90, 40, 60, 80, 100, 65, 45, 85, 40].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        isPlaying ? "bg-[#F26522]" : "bg-gray-300"
                      }`}
                      style={{
                        height: isPlaying ? `${Math.max(20, (h * (seconds % 5 + 3)) / 7)}%` : "25%",
                      }}
                    />
                  ))}
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full font-medium">
                    ✓ 99.4% Diarization
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OtterLiveTranscription;
