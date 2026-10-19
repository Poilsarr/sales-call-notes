"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
} from "lucide-react";


export function StudioShowcaseBento() {
  const [activeChecklist, setActiveChecklist] = useState<number[]>([0, 1, 2]);

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
            <div className="rounded-2xl p-7 sm:p-8 pb-0 bg-[#F5F6F8] border border-black/[0.06] shadow-sm flex flex-col relative overflow-hidden group">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-0.5 rounded-full font-semibold">
                      Client-Side Extension
                    </span>
                  </div>
                  <h3 className="text-[22px] sm:text-[24px] font-medium tracking-[-0.02em] text-gray-900 mb-1.5">
                    A Chrome extension for bot-free meetings
                  </h3>
                  <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed">
                    Record conversations directly from your Mac or Windows browser tab, without awkward bots joining the call or tripping IT bans.
                  </p>
                </div>
                <Link
                  href="/extension"
                  className="hidden sm:inline-flex items-center gap-1 text-[12px] font-semibold text-[#F26522] hover:underline shrink-0 mb-1"
                >
                  <span>Get extension</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Studio product plate: Meet call + Gauge extension, zero bots */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/studio/gauge_chrome_extension_studio.jpg"
                alt="Gauge Chrome extension capturing a Google Meet sales call with zero bots in the room"
                className="block w-full mt-6"
                loading="lazy"
              />
            </div>

            {/* BOTTOM CARD: See the words, as they're spoken (Screenshot 1 Bottom Right) */}
            <div className="rounded-2xl p-7 sm:p-8 pb-0 bg-[#FAF8F5] border border-orange-100/70 shadow-sm flex flex-col relative overflow-hidden">
              <div>
                <h3 className="text-[22px] sm:text-[24px] font-medium tracking-[-0.02em] text-gray-900 mb-1.5">
                  See the words, as they&apos;re spoken
                </h3>
                <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed">
                  Live transcription with speaker recognition, real-time competitor tags, and instant CRM sync.
                </p>
              </div>

              {/* Studio product plate: speaker-identified transcript + audio waveform */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/studio/gauge_transcription_studio.jpg"
                alt="Live transcript with speaker recognition, a detected competitor tag for Gong, and synced CRM notes"
                className="block w-full mt-5"
                loading="lazy"
              />
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
