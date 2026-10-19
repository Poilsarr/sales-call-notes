"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Globe, Smartphone, UploadCloud, Shield, CheckCircle2, ArrowRight, Zap } from "lucide-react";

export function OtterCaptureShowcase() {
  const [selectedMode, setSelectedMode] = useState<"extension" | "mobile" | "upload">("extension");

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-white border-b border-black/[0.04] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* LEFT: Floating 3D Mobile Device Studio Mockup */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative z-10 w-full max-w-[340px] sm:max-w-[380px] transition-transform duration-500 hover:scale-[1.02]">
              <div className="rounded-2xl p-2 bg-neutral-100 shadow-sm ring-1 ring-black/[0.08]">
                <div className="rounded-xl overflow-hidden bg-neutral-900 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/studio/gauge_mobile_interface.jpg"
                    alt="Gauge Mobile Companion App floating in 3D"
                    width={768}
                    height={1024}
                    className="w-full h-auto block object-cover"
                  />
                </div>
              </div>

              {/* Floating Pill Badges */}
              <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-black/[0.06] flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-orange-100 text-[#F26522] flex items-center justify-center font-bold text-sm">
                  <Zap size={16} />
                </span>
                <div>
                  <p className="text-[12px] font-bold text-gray-900">Rival Alert Pushed</p>
                  <p className="text-[10px] font-mono text-gray-500">2s latency to Slack</p>
                </div>
              </div>

              <div className="absolute top-8 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-black/[0.06] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px] font-semibold text-gray-800">Zero Bots in Call</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Feature Breakdown & Mode Picker */}
          <div className="lg:col-span-7">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#F26522] mb-3">
              Capture anywhere
            </p>
            <h2 className="text-[clamp(1.75rem,4vw,2.85rem)] font-medium tracking-[-0.03em] text-gray-900 leading-[1.12] mb-4">
              Choose how you capture meetings.
            </h2>
            <p className="text-[15px] sm:text-[16px] text-gray-600 leading-relaxed mb-8 max-w-xl">
              No awkward recording bots sitting in your Google Meet or Zoom calls scaring away executive prospects. Capture effortlessly across browser, mobile, or direct upload.
            </p>

            {/* Interactive Mode Cards */}
            <div className="space-y-4">
              {/* Option 1: Chrome Extension */}
              <div
                onClick={() => setSelectedMode("extension")}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedMode === "extension"
                    ? "bg-[#FFF9F6] border-[#F26522] shadow-sm ring-1 ring-[#F26522]/20"
                    : "bg-white border-black/[0.06] hover:border-black/[0.12]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedMode === "extension"
                        ? "bg-[#F26522] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Globe size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-[16px]">
                        Google Meet Chrome Extension (Bot-Free)
                      </h3>
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
                        Most Popular
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
                      Captures live captions directly in your browser. Zero external bots join or announce themselves. You get instant notes seconds after closing the tab.
                    </p>
                    <Link
                      href="/extension"
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#F26522] hover:underline"
                    >
                      Get the Chrome Extension <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Option 2: Mobile Companion */}
              <div
                onClick={() => setSelectedMode("mobile")}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedMode === "mobile"
                    ? "bg-[#FFF9F6] border-[#F26522] shadow-sm ring-1 ring-[#F26522]/20"
                    : "bg-white border-black/[0.06] hover:border-black/[0.12]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedMode === "mobile"
                        ? "bg-[#F26522] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Smartphone size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-[16px]">
                        Mobile Companion & In-Person Recording
                      </h3>
                      <span className="text-[11px] font-mono text-gray-500">iOS & Android</span>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                      Capture conference room sales meetings, on-site client discovery, or ask your AI coach for immediate recap questions right from your phone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 3: Direct File Upload */}
              <div
                onClick={() => setSelectedMode("upload")}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedMode === "upload"
                    ? "bg-[#FFF9F6] border-[#F26522] shadow-sm ring-1 ring-[#F26522]/20"
                    : "bg-white border-black/[0.06] hover:border-black/[0.12]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedMode === "upload"
                        ? "bg-[#F26522] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <UploadCloud size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-[16px]">
                        1-Click Audio & Video Upload
                      </h3>
                      <span className="text-[11px] font-mono text-gray-500">MP3, M4A, WAV, MP4</span>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                      Already have call recordings from Zoom or phone systems? Drag and drop any file into Gauge for instant 60-second transcription and CRM sync.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OtterCaptureShowcase;
