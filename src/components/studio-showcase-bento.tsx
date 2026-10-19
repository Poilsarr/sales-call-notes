"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  ArrowRight,
  Check,
} from "lucide-react";


export function StudioShowcaseBento() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [waveformTime, setWaveformTime] = useState(14);
  const [activeChecklist, setActiveChecklist] = useState<number[]>([0, 1, 2]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setWaveformTime((t) => (t >= 32 ? 14 : t + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleCheck = (idx: number) => {
    setActiveChecklist((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section
      data-track-section="studio-showcase"
      aria-label="Product Studio Showcase"
      className="py-16 sm:py-20 lg:py-24 bg-[#F8F9FA] border-b border-black/[0.05] overflow-hidden"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10">
        {/* Section Headline — Studio Style */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="text-[12px] font-mono uppercase tracking-[0.18em] text-[#F26522] font-semibold mb-3">
            Your Virtual Competitor on call
          </p>
          <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-medium tracking-[-0.03em] text-gray-900 leading-[1.08] text-balance">
            Get instant competitive intelligence you can trust.
          </h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Gauge turns every sales conversation into live battlecards, structured MEDDPICC notes, and automated CRM updates — with zero recording bots.
          </p>
        </div>

        {/* 2-Column Bento Grid (Matching Reference Screenshot 1 & 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch mb-8">
          {/* LEFT TALL CARD: "Ask Gauge anything" + Studio Phone Mockup */}
          <div className="lg:col-span-6 rounded-2xl p-7 sm:p-9 border border-black/[0.06] shadow-sm flex flex-col justify-between relative overflow-hidden group"
            style={{
              background: "linear-gradient(145deg, #1a0f00 0%, #2d1800 35%, #3d2200 55%, #F26522 130%)",
            }}
          >
            {/* Top Text — on dark bg */}
            <div className="relative z-10">
              <h3 className="text-[24px] sm:text-[27px] font-medium tracking-[-0.02em] text-white mb-2">
                Ask Gauge anything
              </h3>
              <p className="text-[14px] sm:text-[15px] text-white/65 leading-relaxed max-w-md">
                Gauge AI searches across your calls and CRM to instantly answer deal questions, objection handling, and competitor tactics.
              </p>
            </div>

            {/* Studio phone image inside polished dark device frame */}
            <div className="my-8 flex justify-center relative z-10">
              <div
                className="relative rounded-[2.4rem] overflow-hidden shadow-2xl"
                style={{
                  width: "200px",
                  background: "#0d0d0d",
                  padding: "10px 8px 14px",
                  boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
                }}
              >
                {/* Notch */}
                <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-20" />
                {/* Home indicator */}
                <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-20" />
                {/* Screen — actual studio image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/studio/gauge_mobile_interface.jpg"
                  alt="Gauge mobile app showing live battlecard intelligence"
                  className="w-full rounded-[1.8rem] object-cover object-top"
                  style={{ height: "360px" }}
                  loading="lazy"
                />
                {/* Live indicator overlay */}
                <div className="absolute top-7 right-3 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono font-bold text-emerald-300 uppercase tracking-wide">Live</span>
                </div>
              </div>
            </div>

            {/* Bottom Sub-Pill on dark bg */}
            <div className="relative z-10 pt-2 flex items-center justify-between text-[12px] text-white/50 font-mono border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Zero Latency Querying</span>
              </span>
              <span className="text-white/35">Encrypted in session memory</span>
            </div>
          </div>

          {/* RIGHT COLUMN: 2 Stacked Cards (Screenshot 1 Right) */}
          <div className="lg:col-span-6 flex flex-col gap-6 lg:gap-8">
            {/* TOP CARD: A desktop app / Chrome extension for bot-free meetings */}
            <div className="rounded-2xl p-7 sm:p-8 bg-[#F5F6F8] border border-black/[0.06] shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-0.5 rounded-full font-semibold">
                    Client-Side Extension
                  </span>
                </div>
                <h3 className="text-[22px] sm:text-[24px] font-medium tracking-[-0.02em] text-gray-900 mb-1.5">
                  A Chrome extension for bot-free meetings
                </h3>
                <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed mb-6">
                  Record conversations directly from your Mac or Windows browser tab, without awkward bots joining the call or tripping IT bans.
                </p>
              </div>

              {/* Mac Dock / Toolbar Mockup with Gauge Extension Icon (Screenshot 1 Top Right) */}
              <div className="rounded-xl bg-white border border-black/[0.08] p-4 shadow-sm relative">
                {/* Browser Tab Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-gray-800">meet.google.com/qxm-sales-call</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full font-medium">
                    0 Bots in room
                  </span>
                </div>

                {/* Simulated Dock / Extension Strip */}
                <div className="mt-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Gauge Extension Icon with notification badge */}
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-[#F26522] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        G
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">Gauge Chrome Extension</p>
                      <p className="text-[11px] text-gray-500">Capturing tab audio + live captions</p>
                    </div>
                  </div>

                  <Link
                    href="/extension"
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#F26522] hover:underline"
                  >
                    <span>Get extension</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>

            {/* BOTTOM CARD: See the words, as they're spoken (Screenshot 1 Bottom Right) */}
            <div className="rounded-2xl p-7 sm:p-8 bg-[#FAF8F5] border border-orange-100/70 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div>
                <h3 className="text-[22px] sm:text-[24px] font-medium tracking-[-0.02em] text-gray-900 mb-1.5">
                  See the words, as they&apos;re spoken
                </h3>
                <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed mb-5">
                  Live transcription with speaker recognition, real-time competitor tags, and instant CRM sync.
                </p>
              </div>

              {/* Transcript Stream with Speaker Avatars & Waveform Pill (Screenshot 2 Right) */}
              <div className="space-y-3 bg-white rounded-xl p-4 border border-black/[0.06] shadow-sm">
                {/* Speaker 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                    MR
                  </div>
                  <div className="flex-1 text-[12px]">
                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono mb-0.5">
                      <span className="font-semibold text-gray-800">Mark Roberts</span>
                      <span>0:01</span>
                    </div>
                    <p className="text-gray-700">
                      &ldquo;Good morning everyone. Let&apos;s dive into Q4 revenue goals. Are you evaluating Gong or Gauge?&rdquo;
                    </p>
                  </div>
                </div>

                {/* Speaker 2 with highlight */}
                <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                  <div className="w-7 h-7 rounded-full bg-[#F26522] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    SC
                  </div>
                  <div className="flex-1 text-[12px]">
                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono mb-0.5">
                      <span className="font-semibold text-gray-800">Sarah Chen</span>
                      <span>0:14</span>
                      <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-semibold">
                        Rival detected: Gong
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      &ldquo;We looked at Gong, but their \$1,400 per seat minimum and mandatory recording bot didn&apos;t fit our team.&rdquo;
                    </p>
                  </div>
                </div>

                {/* Waveform audio player bar (Matching Screenshot 2 Audio Toolbar Pill) */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between bg-neutral-50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs hover:bg-black transition-colors"
                      aria-label={isPlaying ? "Pause playback" : "Play playback"}
                    >
                      {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                    </button>
                    <span className="font-mono text-[11px] text-gray-700 font-semibold">
                      00:{waveformTime < 10 ? `0${waveformTime}` : waveformTime}
                    </span>
                    {/* Waveform bars */}
                    <div className="flex items-center gap-0.5 h-4">
                      <span className="w-1 bg-[#F26522] rounded-full animate-pulse h-2" />
                      <span className="w-1 bg-[#F26522] rounded-full animate-pulse h-4" />
                      <span className="w-1 bg-[#F26522] rounded-full animate-pulse h-3" />
                      <span className="w-1 bg-[#F26522] rounded-full animate-pulse h-5" />
                      <span className="w-1 bg-[#F26522] rounded-full animate-pulse h-2" />
                      <span className="w-1 bg-gray-300 rounded-full h-1" />
                      <span className="w-1 bg-gray-300 rounded-full h-2" />
                      <span className="w-1 bg-gray-300 rounded-full h-1" />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">32kbps Opus</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FULL-WIDTH BOTTOM CARD: Automate the action items (Screenshot 2 Bottom) */}
        <div className="rounded-2xl p-7 sm:p-9 bg-white border border-black/[0.06] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left text */}
            <div className="lg:col-span-5">
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-700 font-semibold mb-2 block">
                Zero Rep Data Entry
              </span>
              <h3 className="text-[24px] sm:text-[27px] font-medium tracking-[-0.02em] text-gray-900 mb-2">
                Automate the action items &amp; CRM fields
              </h3>
              <p className="text-[14px] text-gray-600 leading-relaxed mb-4">
                Clear next steps, MEDDPICC qualification criteria, and deal stages are automatically captured and pushed to HubSpot and Salesforce in 60 seconds.
              </p>
              <div className="flex items-center gap-2 text-[12px] font-mono text-gray-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>HubSpot &amp; Salesforce API Connected</span>
              </div>
            </div>

            {/* Right: 3 Interactive Checkbox Cards with Avatars (Screenshot 2 Bottom Checklist) */}
            <div className="lg:col-span-7 space-y-3">
              {[
                {
                  id: 0,
                  text: "Economic Buyer confirmed: VP of Sales ($45k budget allocated)",
                  avatar: "SC",
                  role: "Sarah Chen · Economic Buyer",
                  badge: "MEDDPICC",
                },
                {
                  id: 1,
                  text: "Competitor objection countered: Gong seat minimums trap shared",
                  avatar: "DM",
                  role: "David Miller · Account Exec",
                  badge: "Battlecard",
                },
                {
                  id: 2,
                  text: "Push deal updates & schedule security review in HubSpot for Friday",
                  avatar: "AR",
                  role: "Alex Rivera · RevOps",
                  badge: "CRM Sync",
                },
              ].map((item) => {
                const checked = activeChecklist.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      checked
                        ? "bg-white border-black/[0.08] shadow-sm"
                        : "bg-neutral-50/60 border-black/[0.04] opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? "bg-[#10b981] text-white"
                            : "border border-gray-300 bg-white"
                        }`}
                      >
                        {checked && <Check size={13} strokeWidth={3} />}
                      </div>
                      <span className="text-[13px] sm:text-[14px] font-medium text-gray-800 truncate">
                        {item.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-gray-600">
                        {item.badge}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-800 text-[10px] font-bold flex items-center justify-center">
                        {item.avatar}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
