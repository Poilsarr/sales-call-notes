"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Nav from "@/components/nav";
import {
  Mic, FileText, Brain, Target, Share2, BarChart3,
  Upload, Layers, Shield, Globe, Download, Search,
  Users, Sparkles, ArrowRight
} from "lucide-react";

const features = [
  { icon: <Upload strokeWidth={1} className="w-5 h-5" />, title: "Audio Upload", desc: "Drag-drop or click to upload MP3, WAV, M4A, WebM files. Process recordings instantly." },
  { icon: <Mic strokeWidth={1} className="w-5 h-5" />, title: "AI Transcription", desc: "Powered by Whisper AI. Accurate speech-to-text with speaker identification support." },
  { icon: <Brain strokeWidth={1} className="w-5 h-5" />, title: "Smart Summarization", desc: "Extract 2-3 sentence summaries, action items, key decisions, and next steps automatically." },
  { icon: <Target strokeWidth={1} className="w-5 h-5" />, title: "Action Item Extraction", desc: "Identify tasks, owners, and due dates from every call. Never miss a follow-up." },
  { icon: <Share2 strokeWidth={1} className="w-5 h-5" />, title: "One-Click CRM Export", desc: "Copy formatted notes for HubSpot, Salesforce, or Microsoft Teams in one click." },
  { icon: <BarChart3 strokeWidth={1} className="w-5 h-5" />, title: "Call Analytics", desc: "Track health scores, sentiment, talk ratios, budget signals, and decision-maker presence." },
  { icon: <Users strokeWidth={1} className="w-5 h-5" />, title: "Speaker Diarization", desc: "Automatic speaker labeling so you know who said what during the conversation." },
  { icon: <Search strokeWidth={1} className="w-5 h-5" />, title: "Searchable History", desc: "Full call archive with search and filter by date, customer, or keywords." },
  { icon: <Shield strokeWidth={1} className="w-5 h-5" />, title: "Local Processing", desc: "AI runs locally by default. Your call data never leaves your machine." },
  { icon: <Globe strokeWidth={1} className="w-5 h-5" />, title: "Multi-Language", desc: "Transcribe and analyze calls in English, Spanish, French, German, and more." },
  { icon: <Download strokeWidth={1} className="w-5 h-5" />, title: "JSON Export", desc: "Export structured data for API integrations and custom workflows." },
  { icon: <Layers strokeWidth={1} className="w-5 h-5" />, title: "Team Dashboard", desc: "Manager view of all team calls with aggregated analytics and performance metrics." },
];

export default function FeaturesPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.transform = "translateY(0)";
            el.style.opacity = "1";
            el.style.filter = "blur(0)";
            observerRef.current?.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-[#5e6ad2]/30">
      <Nav />

      <section className="relative min-h-[80dvh] flex flex-col items-center justify-center px-6 pt-32 pb-32 mesh-bg">
        <div className="radial-glow top-[-10%] left-[10%] bg-[#5e6ad2]" />
        <div className="radial-glow bottom-[-10%] right-[5%] bg-[#22d3a8]" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="eyebrow inline-flex items-center gap-2 mb-8 reveal"
            style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.1s", transform: "translateY(16px)", opacity: 0, filter: "blur(4px)" }}>
            <Sparkles strokeWidth={1} className="w-3 h-3" /> Everything you need
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[0.85] mb-6 reveal"
            style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.2s", transform: "translateY(24px)", opacity: 0, filter: "blur(6px)" }}>
            Features built for<br />
            <span className="text-white/20">the modern SDR</span>
          </h1>
          <p className="text-base md:text-lg text-white/30 max-w-2xl mx-auto font-[425] leading-relaxed reveal"
            style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.3s", transform: "translateY(16px)", opacity: 0, filter: "blur(4px)" }}>
            From transcription to CRM export, CallNote Pro handles the entire sales call workflow.
            No bots. No complex setup. Just results.
          </p>
        </div>
      </section>

      <section className="py-32 md:py-44 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="reveal"
              style={{ transition: `all 0.8s cubic-bezier(0.25,1,0.5,1) ${0.1 + i * 0.05}s`, transform: "translateY(24px)", opacity: 0, filter: "blur(4px)" }}>
              <div className="doppel-outer h-full group cursor-default">
                <div className="doppel-inner p-6 md:p-8 h-full">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-5 text-white/40 group-hover:text-white group-hover:bg-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    {f.icon}
                  </div>
                  <h3 className="font-display font-semibold tracking-tight text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-white/40 font-[425] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-32 md:pb-44 px-6">
        <div className="max-w-4xl mx-auto text-center reveal"
          style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1)", transform: "translateY(24px)", opacity: 0, filter: "blur(4px)" }}>
          <div className="doppel-outer">
            <div className="doppel-inner p-12 md:p-20">
              <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tighter leading-[0.9] mb-4">Ready to save hours every week?</h2>
              <p className="text-white/30 mb-8 text-sm">Join SDRs who cut their note-taking time by 80%.</p>
              <Link href="/"
                className="btn-island inline-flex items-center gap-3 bg-white text-[#050505] hover:bg-white/90 group">
                Get Started Free
                <span className="icon-wrap bg-[#050505]/10 group-hover:bg-[#050505]/15">
                  <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
