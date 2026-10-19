"use client";

import { useState } from "react";
import { ShieldCheck, Lock, Cpu, RefreshCw, Layers } from "lucide-react";

export function OtterEcosystemShowcase() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [meetingAccess, setMeetingAccess] = useState(true);
  const [zeroTraining, setZeroTraining] = useState(true);

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-[#FAFAFC] border-b border-black/[0.04] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#F26522] bg-[#F26522]/10 border border-[#F26522]/20 px-3.5 py-1 rounded-full mb-3.5">
            <Layers size={12} />
            <span>Connected Ecosystem</span>
          </div>
          <h2 className="text-[clamp(1.75rem,4vw,2.85rem)] font-medium tracking-[-0.03em] text-gray-900 leading-[1.12]">
            Pull sales intelligence into your favorite AI chat &amp; CRM.
          </h2>
          <p className="mt-3 text-gray-600 text-[14px] sm:text-[16px] leading-relaxed max-w-xl mx-auto">
            ChatGPT, Claude, Slack, HubSpot, and Salesforce seamlessly query your meeting knowledge through Gauge&apos;s MCP server and bi-directional pipelines.
          </p>
        </div>

        {/* 2-Column Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* LEFT: 3D Floating Ecosystem Visual (Otter Style) */}
          <div className="lg:col-span-6 doppel-outer">
            <div className="doppel-inner bg-white p-6 sm:p-8 h-full flex flex-col justify-between overflow-hidden">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-gray-500 mb-2 block">
                  Connected Intelligence
                </span>
                <h3 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-2">
                  Unified AI &amp; Deal Room Hub
                </h3>
                <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
                  Every sales signal, competitor quote, and next step flows instantly into Slack channels, CRM pipelines, or your team&apos;s custom AI agents.
                </p>
              </div>

              {/* 3D Integrations Render with floating effect */}
              <div className="relative rounded-2xl overflow-hidden bg-[#FAFAF8] border border-black/[0.04] p-4 flex items-center justify-center my-4 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/studio/gauge_integrations_3d.jpg"
                  alt="3D Floating Glass Integrations Ecosystem: Slack, HubSpot, Salesforce, Claude, ChatGPT"
                  width={600}
                  height={600}
                  className="w-full max-w-[420px] h-auto object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Floating pill over image */}
                <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 bg-white/90 backdrop-blur-md rounded-xl p-3 border border-black/[0.06] shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-mono font-medium text-gray-800">
                      Gauge MCP Server: Active
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">Live Query Sync</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-gray-500">
                <span className="px-2.5 py-1 rounded-full bg-neutral-100">Slack</span>
                <span className="px-2.5 py-1 rounded-full bg-neutral-100">Salesforce</span>
                <span className="px-2.5 py-1 rounded-full bg-neutral-100">HubSpot</span>
                <span className="px-2.5 py-1 rounded-full bg-neutral-100">Claude MCP</span>
                <span className="px-2.5 py-1 rounded-full bg-neutral-100">ChatGPT</span>
                <span className="px-2.5 py-1 rounded-full bg-neutral-100">Google Meet</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Enterprise Governance & Security Controls (Otter Style) */}
          <div className="lg:col-span-6 doppel-outer">
            <div className="doppel-inner bg-white p-6 sm:p-8 h-full flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-gray-500 mb-2 block">
                  Enterprise Readiness
                </span>
                <h3 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-2">
                  Scale with your company.
                </h3>
                <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
                  Gauge is built with the security, governance, and strict compliance controls enterprises demand. Never train on client audio.
                </p>

                {/* Security Interactive Toggle List (Identical to Otter.ai Security Cards) */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-gray-100 bg-neutral-50/70 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-gray-900">Two-Factor Authentication (2FA)</p>
                      <p className="text-[12px] text-gray-500">Require extra verification step when logging in.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTwoFactor(!twoFactor)}
                      aria-label="Toggle Two-Factor Authentication"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        twoFactor ? "bg-[#F26522]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          twoFactor ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-100 bg-neutral-50/70 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-gray-900">Meeting Access Controls</p>
                      <p className="text-[12px] text-gray-500">Limit who can join or view sales call intelligence.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMeetingAccess(!meetingAccess)}
                      aria-label="Toggle Meeting Access Controls"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        meetingAccess ? "bg-[#F26522]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          meetingAccess ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-100 bg-neutral-50/70 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-gray-900">Zero AI Model Training Guarantee</p>
                      <p className="text-[12px] text-gray-500">Your customer conversations are never used to train public LLMs.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setZeroTraining(!zeroTraining)}
                      aria-label="Toggle Zero Training"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        zeroTraining ? "bg-[#F26522]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          zeroTraining ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Badge Row */}
              <div className="pt-6 mt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-[12px] text-gray-600">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  SOC-2 Type II Certified
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Lock size={16} className="text-blue-600" />
                  AES-256 Encryption at Rest
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OtterEcosystemShowcase;
