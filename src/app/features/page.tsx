"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Nav from "@/components/nav";
import {
  Mic, FileText, Brain, Target, Share2, BarChart3,
  Upload, Layers, Shield, Globe, Download, Search,
  Users, Sparkles, ArrowRight, Zap, Cpu, Lock, Clock,
} from "lucide-react";

const features = [
  { icon: Upload, title: "Audio Upload", desc: "Drag-drop or click to upload MP3, WAV, M4A, WebM files. Process recordings instantly.", color: "#F26522" },
  { icon: Mic, title: "AI Transcription", desc: "Powered by Whisper AI. Accurate speech-to-text with speaker identification support.", color: "#2563eb" },
  { icon: Brain, title: "Smart Summarization", desc: "Extract 2-3 sentence summaries, action items, key decisions, and next steps automatically.", color: "#7c3aed" },
  { icon: Target, title: "Action Item Extraction", desc: "Identify tasks, owners, and due dates from every call. Never miss a follow-up.", color: "#d97706" },
  { icon: Share2, title: "One-Click CRM Export", desc: "Copy formatted notes for HubSpot, Salesforce, or Microsoft Teams in one click.", color: "#059669" },
  { icon: BarChart3, title: "Call Analytics", desc: "Track health scores, sentiment, talk ratios, budget signals, and decision-maker presence.", color: "#dc2626" },
  { icon: Users, title: "Speaker Diarization", desc: "Automatic speaker labeling so you know exactly who said what during the conversation.", color: "#0891b2" },
  { icon: Search, title: "Searchable History", desc: "Full call archive with search and filter by date, customer, or keywords.", color: "#4f46e5" },
  { icon: Shield, title: "Local Processing", desc: "AI runs locally by default. Your call data never leaves your machine.", color: "#059669" },
  { icon: Globe, title: "Multi-Language", desc: "Transcribe and analyze calls in English, Spanish, French, German, and more.", color: "#ea580c" },
  { icon: Download, title: "JSON Export", desc: "Export structured data for API integrations and custom workflows.", color: "#9333ea" },
  { icon: Layers, title: "Team Dashboard", desc: "Manager view of all team calls with aggregated analytics and performance metrics.", color: "#0891b2" },
];

const stats = [
  { value: "60s", label: "Avg. processing time" },
  { value: "98%", label: "Transcription accuracy" },
  { value: "12+", label: "Languages supported" },
  { value: "10+", label: "CRM integrations" },
];

const steps = [
  { num: "01", title: "Upload", desc: "Drop your call recording — MP3, WAV, or M4A", icon: Upload, color: "#F26522" },
  { num: "02", title: "Transcribe", desc: "Whisper AI converts speech to accurate text", icon: Mic, color: "#2563eb" },
  { num: "03", title: "Analyze", desc: "AI extracts insights, action items, and decisions", icon: Brain, color: "#7c3aed" },
  { num: "04", title: "Export", desc: "Push formatted notes to CRM with one click", icon: Share2, color: "#059669" },
];

export default function FeaturesPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observerRef.current?.unobserve(e.target);
          }
        });
      }, { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />

      {/* Hero */}
      <section className="relative pt-36 pb-20 sm:pt-40 sm:pb-24 px-5 sm:px-8 lg:px-12 bg-[#EFEFEF] overflow-hidden">
        <div className="max-w-[1440px] mx-auto text-center">
          <div className="eyebrow inline-flex items-center gap-2 mb-6 reveal">
            <Sparkles size={12} /> Everything you need
          </div>
          <h1 className="text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-5">
            Features built for<br />
            <span className="text-gray-400">the modern SDR</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-[15px] leading-relaxed mb-8">
            From transcription to CRM export, CallNote Pro handles the entire sales call workflow.
            No bots. No complex setup. Just results.
          </p>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-gray-200 text-[12px] text-gray-500">
            <Cpu size={14} className="text-[#F26522]" />
            <span>12 features</span>
            <span className="text-gray-300">|</span>
            <Lock size={14} className="text-[#F26522]" />
            <span>SOC 2 compliant</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-20 lg:py-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
              <div className="doppel-outer h-full group">
                <div className="doppel-inner p-6 sm:p-8 h-full flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(90deg, transparent, ${f.color}40, transparent)` }} />
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: `${f.color}10` }}>
                      <f.icon size={20} style={{ color: f.color }} strokeWidth={1.5} />
                    </div>
                    <div className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: `${f.color}08`, color: f.color }}>
                      Feature {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight mb-2 text-gray-900">{f.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed flex-1">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 sm:py-20 px-5 sm:px-8 lg:px-12 bg-[#F5F5F5]">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s, i) => (
            <div key={i} className="reveal">
              <div className="doppel-outer">
                <div className="doppel-inner p-6 sm:p-8 text-center">
                  <div className="text-[clamp(1.5rem,3vw,2.5rem)] font-semibold tracking-tighter text-gray-900 mb-1">{s.value}</div>
                  <div className="text-[12px] text-gray-500">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="py-16 sm:py-20 lg:py-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-14 reveal">
            <div className="eyebrow inline-flex items-center gap-2 mb-5">
              <Zap size={12} /> How it works
            </div>
            <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em]">
              Four steps to <span className="text-gray-400">zero notes</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            {steps.map((s, i) => (
              <div key={i} className="reveal">
                <div className="doppel-outer h-full">
                  <div className="doppel-inner p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${s.color}10` }}>
                        <s.icon size={18} style={{ color: s.color }} strokeWidth={1.5} />
                      </div>
                      <span className="font-mono text-[10px] text-gray-400 font-medium">{s.num}</span>
                    </div>
                    <h3 className="text-[15px] font-semibold tracking-tight mb-1 text-gray-900">{s.title}</h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16 sm:pb-20 lg:pb-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="doppel-outer group">
            <div className="doppel-inner p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(242,101,34,0.06), transparent 70%)" }} />
              <div className="relative z-10">
                <div className="eyebrow inline-flex items-center gap-2 mb-5">
                  <Zap size={12} /> Start today
                </div>
                <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3">
                  Ready to save hours every week?
                </h2>
                <p className="text-gray-500 mb-8 text-[14px]">Join SDRs who cut their note-taking time by 80%.</p>
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300"
                >
                  <span className="flex flex-col overflow-hidden h-[20px]">
                    <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                      Get started free
                    </span>
                    <span className="leading-[20px]">Get started free</span>
                  </span>
                  <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                    <ArrowRight size={14} className="text-[#F26522]" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
