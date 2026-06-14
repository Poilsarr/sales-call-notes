"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Nav from "@/components/nav";
import { motion, useInView } from "framer-motion";
import { useUser, SignInButton } from "@clerk/nextjs";
import {
  Mic, Brain, Target, Share2, BarChart3,
  Upload, Layers, Shield, Globe, Download, Search,
  Users, Sparkles, ArrowRight, Zap, Cpu, Lock, Clock, Check,
} from "lucide-react";
import {
  AFileUpload, ATranscription, ASummarization, ASearch, ALocal, ALang,
} from "@/components/feature-3d-a";
import { BSummarization, BGlobe, BRocket } from "@/components/feature-3d-b";
import { CAct, CHud, CSpeaker, CJson, CTeam } from "@/components/feature-3d-c";

const features = [
  { icon: Upload, title: "Audio Upload", desc: "Drag-drop or click to upload MP3, WAV, M4A, WebM files. Process recordings instantly.", color: "#F26522", direction: "a" as const },
  { icon: Mic, title: "AI Transcription", desc: "Powered by Whisper AI. Accurate speech-to-text with speaker identification.", color: "#2563eb", direction: "a" as const },
  { icon: Brain, title: "Smart Summarization", desc: "Extract 2-3 sentence summaries, action items, and key decisions automatically.", color: "#7c3aed", direction: "b" as const },
  { icon: Target, title: "Action Items", desc: "Identify tasks, owners, and due dates from every call. Never miss a follow-up.", color: "#d97706", direction: "c" as const },
  { icon: Share2, title: "CRM Export", desc: "Copy formatted notes for HubSpot, Salesforce, or Microsoft Teams in one click.", color: "#059669", direction: "b" as const },
  { icon: BarChart3, title: "Call Analytics", desc: "Track health scores, sentiment, talk ratios, budget signals, and deal health.", color: "#dc2626", direction: "c" as const },
  { icon: Users, title: "Speaker Diarization", desc: "Automatic speaker labeling so you know exactly who said what during calls.", color: "#0891b2", direction: "c" as const },
  { icon: Search, title: "Searchable History", desc: "Full archive with semantic search and filter by date, customer, or keywords.", color: "#4f46e5", direction: "a" as const },
  { icon: Shield, title: "Local Processing", desc: "AI runs locally by default. Your call data never leaves your machine.", color: "#059669", direction: "a" as const },
  { icon: Globe, title: "Multi-Language", desc: "Transcribe and analyze in English, Spanish, French, German, and beyond.", color: "#ea580c", direction: "b" as const },
  { icon: Download, title: "JSON Export", desc: "Export structured data for API integrations and custom data pipelines.", color: "#9333ea", direction: "c" as const },
  { icon: Layers, title: "Team Dashboard", desc: "Manager view of all team calls with aggregated analytics and performance metrics.", color: "#0891b2", direction: "c" as const },
];

const categories = [
  { name: "Core Platform", desc: "The essential pipeline from raw audio to structured insights", start: 0, end: 4 },
  { name: "Analytics & Intelligence", desc: "Deep understanding of every customer conversation", start: 4, end: 8 },
  { name: "Enterprise & Security", desc: "Scale with confidence across your entire organization", start: 8, end: 12 },
];

function Feature3D({ index, color }: { index: number; color: string }) {
  const f = features[index];
  if (f.direction === "a") {
    switch (index) {
      case 0: return <AFileUpload color={color} />;
      case 1: return <ATranscription color={color} />;
      case 7: return <ASearch color={color} />;
      case 8: return <ALocal color={color} />;
      case 9: return <ALang color={color} />;
      default: return <ASummarization color={color} />;
    }
  }
  if (f.direction === "b") {
    if (index === 4) return <BRocket />;
    if (index === 9) return <BGlobe />;
    return <BSummarization />;
  }
  switch (index) {
    case 3: return <CAct />;
    case 5: return <CHud />;
    case 6: return <CSpeaker />;
    case 10: return <CJson />;
    case 11: return <CTeam />;
    default: return <CAct />;
  }
}

function HeroMockup() {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-lg mx-auto mt-7"
    >
      <div className="doppel-outer shadow-xl shadow-black/5">
        <div className="doppel-inner p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-wider text-gray-400 font-medium uppercase">Live Transcription</span>
            <span className="ml-auto text-[9px] font-mono text-gray-300">00:00 / 12:34</span>
          </div>
          <div className="flex items-end gap-[2px] h-6 mb-3">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-full" style={{
                height: `${Math.random() * 100 + 10}%`,
                background: i < 16 ? "rgba(242,101,34,0.5)" : "rgba(37,99,235,0.3)",
              }} />
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-[10px] font-mono font-medium text-[#F26522] bg-[#F26522]/8 px-2 py-0.5 rounded-full">Sarah</span>
              <p className="text-[12px] text-gray-600 leading-relaxed">I wanted to walk you through our new pricing structure and see how it aligns with your needs.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-[10px] font-mono font-medium text-[#2563eb] bg-[#2563eb]/8 px-2 py-0.5 rounded-full">John</span>
              <p className="text-[12px] text-gray-600 leading-relaxed">That sounds good. What does the timeline look like for implementation?</p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
            <span className="flex items-center gap-1.5"><Brain size={11} /> AI summary ready</span>
            <span className="flex items-center gap-1.5"><Target size={11} /> 3 action items</span>
            <span className="flex items-center gap-1.5"><BarChart3 size={11} /> Health: 8.4</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 4) * 0.07, ease: "easeOut" }}
    >
      <div className="doppel-outer group h-full cursor-default">
        <div className="doppel-inner p-4 h-full flex flex-col relative transition-shadow duration-300 hover:shadow-lg">
          <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: `radial-gradient(400px circle at 50% 50%, ${feature.color}10, transparent 60%)` }} />
          <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `linear-gradient(90deg, transparent, ${feature.color}40, transparent)` }} />
          <div className="flex items-start justify-between mb-2.5 relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${feature.color}10`, border: `1px solid ${feature.color}20` }}>
              <feature.icon strokeWidth={1.5} className="w-4 h-4" style={{ color: feature.color }} />
            </div>
            <span className="text-[9px] font-mono font-medium px-2 py-1 rounded-full" style={{ color: feature.color, background: `${feature.color}08` }}>
              {index < 4 ? "Core" : index < 8 ? "Intel" : "Scale"}
            </span>
          </div>
          <h3 className="text-[14px] font-semibold tracking-tight mb-1.5 relative">{feature.title}</h3>
          <div className="rounded-xl mb-2.5 flex items-center justify-center overflow-hidden relative" style={{
            background: `${feature.color}04`,
            border: `1px solid ${feature.color}12`,
            height: "90px",
          }}>
            <Feature3D index={index} color={feature.color} />
          </div>
          <p className="text-[12px] text-gray-500 leading-relaxed relative">{feature.desc}</p>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between relative">
            <span className="text-[9px] text-gray-400 uppercase tracking-[0.15em] font-mono">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[9px] text-gray-300 font-mono uppercase tracking-[0.1em]">
              {feature.direction === "a" ? "Stream" : feature.direction === "b" ? "Insight" : "Ops"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const statsData = [
  { value: "60s", label: "Avg. processing", icon: Clock },
  { value: "98%", label: "Transcription accuracy", icon: Target },
  { value: "12+", label: "Languages", icon: Globe },
  { value: "10+", label: "CRM integrations", icon: Share2 },
];

const steps = [
  { num: "01", title: "Upload", desc: "Drop your call recording", icon: Upload, color: "#F26522" },
  { num: "02", title: "Transcribe", desc: "Whisper AI converts to text", icon: Mic, color: "#2563eb" },
  { num: "03", title: "Analyze", desc: "Extract insights & actions", icon: Brain, color: "#7c3aed" },
  { num: "04", title: "Export", desc: "Push to CRM or download", icon: Share2, color: "#059669" },
];

function AnimatedCounter({ value, label, icon: Icon }: { value: string; label: string; icon: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <div className="doppel-outer group">
        <div className="doppel-inner px-5 py-4 sm:py-5 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(242,101,34,0.04), transparent 70%)" }} />
          <Icon strokeWidth={1.5} className="w-4 h-4 text-[#F26522] mb-2 relative" />
          <div className="text-[clamp(1.25rem,2.5vw,2rem)] font-semibold tracking-tighter mb-0.5 relative">{value}</div>
          <div className="text-[11px] text-gray-500 font-medium relative">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturesPage() {
  const { isSignedIn } = useUser();

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-hidden selection:bg-[#F26522]/20">
      <Nav />

      {/* Hero */}
      <section className="relative pt-28 pb-14 px-5 sm:px-8 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(rgba(242,101,34,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(242,101,34,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
        <div className="radial-glow top-[-15%] left-[5%]" style={{ background: "#F26522" }} />
        <div className="radial-glow bottom-[-15%] right-[5%]" style={{ background: "#2563eb" }} />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="eyebrow inline-flex items-center gap-2 mb-6">
              <Sparkles size={12} /> Everything you need
            </div>
          </motion.div>
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-4"
          >
            Features built for<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-600 to-gray-400">
              the modern SDR
            </span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[14px] text-gray-500 max-w-2xl mx-auto leading-relaxed mb-6"
          >
            From transcription to CRM export, CallNote Pro handles the entire sales call workflow.
            No bots. No complex setup. Just results.
          </motion.p>
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-[11px] text-gray-500 shadow-sm"
          >
            <span className="flex items-center gap-1.5"><Cpu size={13} className="text-[#F26522]" />12 features</span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1.5"><Lock size={13} className="text-[#2563eb]" />SOC 2 compliant</span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1.5"><Zap size={13} className="text-[#059669]" />Under 60s</span>
          </motion.div>
          <HeroMockup />
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-6 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          {categories.map((cat, ci) => (
            <div key={ci} className="mb-8 last:mb-0">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                className="text-center mb-5"
              >
                <div className="inline-flex items-center gap-3 mb-2">
                  <div className="h-px w-6 bg-gray-200" />
                  <span className="text-[10px] font-mono font-medium tracking-[0.2em] uppercase text-gray-400">
                    Section {String(ci + 1).padStart(2, "0")}
                  </span>
                  <div className="h-px w-6 bg-gray-200" />
                </div>
                <h2 className="text-[clamp(1.1rem,2.5vw,1.5rem)] font-medium tracking-tight mb-1">{cat.name}</h2>
                <p className="text-[12px] text-gray-500">{cat.desc}</p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {features.slice(cat.start, cat.end).map((f, i) => (
                  <FeatureCard key={cat.start + i} feature={f} index={cat.start + i} />
                ))}
              </div>

              {ci < categories.length - 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                  <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Stats Strip */}
      <section className="px-5 sm:px-8 lg:px-12 pb-6">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {statsData.map((s, i) => (
            <AnimatedCounter key={i} value={s.value} label={s.label} icon={s.icon} />
          ))}
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* Workflow */}
      <section className="py-10 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-7">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
            >
              <div className="eyebrow inline-flex items-center gap-2 mb-4">
                <Zap size={12} /> How it works
              </div>
              <h2 className="text-[clamp(1.25rem,3vw,2.25rem)] font-medium leading-[1.12] tracking-[-0.02em]">
                Four steps to <span className="text-gray-400">zero notes</span>
              </h2>
              <p className="text-[13px] text-gray-500 mt-2 max-w-md mx-auto">
                From raw recording to CRM-ready insights in under 60 seconds
              </p>
            </motion.div>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="doppel-outer group h-full">
                  <div className="doppel-inner p-4 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `radial-gradient(ellipse at 50% 50%, ${s.color}08, transparent 70%)` }} />
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 relative"
                      style={{ background: `${s.color}10`, border: `1px solid ${s.color}20` }}>
                      <s.icon size={15} style={{ color: s.color }} strokeWidth={1.5} />
                    </div>
                    <span className="font-mono text-[9px] text-gray-400 relative">{s.num}</span>
                    <h3 className="text-[13px] font-semibold mt-0.5 relative">{s.title}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 relative">{s.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-12 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="doppel-outer group">
            <div className="doppel-inner p-8 sm:p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(242,101,34,0.06), transparent 70%)" }} />
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#F26522]/20 to-transparent" />
              <div className="relative z-10">
                <div className="eyebrow inline-flex items-center gap-2 mb-4">
                  <Zap size={12} /> Start today
                </div>
                <h2 className="text-[clamp(1.25rem,3vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-2">
                  Ready to save hours every week?
                </h2>
                <p className="text-gray-500 mb-6 text-[13px]">Join SDRs who cut their note-taking time by 80%.</p>
                {isSignedIn ? (
                  <Link href="/app" className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300">
                    <span className="flex flex-col overflow-hidden h-[20px]">
                      <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">Open Dashboard</span>
                      <span className="leading-[20px]">Open Dashboard</span>
                    </span>
                    <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                      <ArrowRight size={14} className="text-[#F26522]" />
                    </span>
                  </Link>
                ) : (
                  <SignInButton mode="modal">
                    <button className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300 cursor-pointer">
                      <span className="flex flex-col overflow-hidden h-[20px]">
                        <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">Get Started Free</span>
                        <span className="leading-[20px]">Get Started Free</span>
                      </span>
                      <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                        <ArrowRight size={14} className="text-[#F26522]" />
                      </span>
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
