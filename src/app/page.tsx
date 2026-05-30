"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import Nav from "@/components/nav";
import Link from "next/link";
import {
  Upload, Brain, Target, BarChart3,
  Share2, History, ArrowRight,
} from "lucide-react";

const AppInterface = dynamic(() => import("@/components/app-interface"), { ssr: false });

export default function Home() {
  const [showApp, setShowApp] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        document.querySelectorAll(".group.relative").forEach((card) => {
          const rect = card.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          (card as HTMLElement).style.setProperty("--mouse-x", `${x}%`);
          (card as HTMLElement).style.setProperty("--mouse-y", `${y}%`);
        });
      });
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => { document.removeEventListener("mousemove", handleMouseMove); cancelAnimationFrame(rafId); };
  }, []);

  const features = [
    { icon: <Upload strokeWidth={1} className="w-5 h-5" />, title: "Local-First Privacy", desc: "Audio processed locally. Your data never leaves your control. Maximum compliance, zero leaks.", accent: "#5e6ad2", metric: "Private" },
    { icon: <Brain strokeWidth={1} className="w-5 h-5" />, title: "Precision Diarization", desc: "Clean speaker separation. No more guessing who said what. Accurate labels for every turn.", accent: "#8b5cf6", metric: "99% Acc" },
    { icon: <Target strokeWidth={1} className="w-5 h-5" />, title: "Knowledge Graph", desc: "Surface patterns across 100s of calls. Find common objections and winning triggers automatically.", accent: "#22d3a8", metric: "Semantic" },
    { icon: <BarChart3 strokeWidth={1} className="w-5 h-5" />, title: "Hyper-Personalization", desc: "AI-generated follow-up hooks based on emotional cues and specific quotes from the call.", accent: "#f59e0b", metric: "10x Reply" },
    { icon: <Share2 strokeWidth={1} className="w-5 h-5" />, title: "CRM Sync", desc: "Push MEDDIC/BANT summaries to HubSpot, Salesforce, or Teams with one click.", accent: "#3b82f6", metric: "3 CRMs" },
    { icon: <History strokeWidth={1} className="w-5 h-s_ la h-5" />, title: "Searchable History", desc: "Full archive with semantic search across all your calls and insights.", accent: "#ec4899", metric: "∞ storage" },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-[#5e6ad2]/30">
      <Nav />

      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 pt-24 pb-32 overflow-hidden mesh-bg">
        <div className="radial-glow top-[-10%] left-[-5%] bg-[#5e6ad2]" />
        <div className="radial-glow bottom-[-20%] right-[-10%] bg-[#22d3a8]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="eyebrow inline-flex items-center gap-2 mb-8 motion-safe:animate-fade-up motion-safe:[animation-delay:100ms]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a8] animate-pulse" />
            Privacy-First AI — Local Processing for SDRs
          </div>

          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-semibold tracking-tighter leading-[0.85] mb-8 motion-safe:animate-fade-up motion-safe:[animation-delay:200ms]">
            Sales call notes,<br />
            <span className="text-white/20">rendered instant.</span>
          </h1>

          <p className="text-base md:text-lg text-white/30 max-w-2xl mx-auto mb-12 font-[425] leading-relaxed motion-safe:animate-fade-up motion-safe:[animation-delay:300ms]">
            Upload your call recording. Get summary, action items, and CRM-ready notes in seconds.
            Built for the modern SDR. No bots, no complex setup.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 motion-safe:animate-fade-up motion-safe:[animation-delay:400ms]">
            {user ? (
              <button onClick={() => setShowApp(true)}
                className="btn-island flex items-center gap-3 bg-white text-[#050505] hover:bg-white/90 group px-8 py-4">
                Open App
                <span className="icon-wrap bg-[#050505]/10 group-hover:bg-[#050505]/15">
                  <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5" />
                </span>
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="btn-island flex items-center gap-3 bg-white text-[#050505] hover:bg-white/90 group px-8 py-4">
                  Get Started Free
                  <span className="icon-wrap bg-[#050505]/10 group-hover:bg-[#050505]/15">
                    <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5" />
                  </span>
                </button>
              </SignInButton>
            )}
            <button onClick={() => setShowApp(true)}
              className="btn-island flex items-center gap-2 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10 px-8 py-4">
              View Demo
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <svg className="w-5 h-5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      <section className="py-32 md:py-44 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 motion-safe:animate-fade-up">
            <div className="eyebrow inline-flex mb-6">Capabilities</div>
            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tighter leading-[0.9] mb-4">
              Everything an SDR needs
            </h2>
            <p className="text-white/30 max-w-xl mx-auto">From upload to CRM export in under 60 seconds. No learning curve.</p>
            <div className="flex items-center justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 text-xs text-white/30">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5e6ad2]" />
                <span>AI-powered</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/30">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22d3a8]" />
                <span>CRM ready</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/30">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
                <span>Free forever</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div key={i} className={`motion-safe:animate-fade-up ${i === 0 ? "md:col-span-2" : ""}`}
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                <div className="group relative h-full">
                  <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${f.accent}15, transparent 40%)` }} />
                  <div className="doppel-outer h-full relative">
                    <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                      style={{ background: `linear-gradient(90deg, transparent, ${f.accent}60, transparent)` }} />
                    <div className="doppel-inner p-8 md:p-10 h-full flex flex-col relative">
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white/60 group-hover:text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${i === 0 ? "md:w-12 md:h-12" : ""}`}
                          style={{ background: `${f.accent}15`, boxShadow: `0 0 20px ${f.accent}10` }}>
                          {f.icon}
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full"
                          style={{ color: f.accent, background: `${f.accent}10` }}>
                          {f.metric}
                        </span>
                      </div>
                      <h3 className={`font-display font-semibold tracking-tight mb-3 ${i === 0 ? "text-xl md:text-2xl" : "text-lg"}`}>{f.title}</h3>
                      <p className="text-sm text-white/40 font-[425] leading-relaxed max-w-md">{f.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 motion-safe:animate-fade-up" style={{ animationDelay: "0.6s" }}>
            <Link href="/features"
              className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white transition-all duration-500 px-6 py-3 rounded-full border border-white/5 hover:border-white/20">
              View all features
              <ArrowRight strokeWidth={1} className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-32 md:py-44 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 motion-safe:animate-fade-up">
            <div className="eyebrow inline-flex mb-6">Testimonials</div>
            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tighter leading-[0.9]">
              Trusted by SDR teams
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { quote: "I easily save hours per week, without a doubt. That's an exponential amount of time savings.", name: "Matt S.", role: "Marketing Manager", initials: "MS" },
              { quote: "Just being conservative — our team is getting 33% time back from manual note-taking.", name: "Laura B.", role: "VP of Sales", initials: "LB" },
              { quote: "Cut my post-call documentation from 15 minutes to 30 seconds. It's a superpower.", name: "Brandon S.", role: "Sales Enablement", initials: "BS" },
            ].map((t, i) => (
              <div key={i} className="motion-safe:animate-fade-up" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
                <div className="doppel-outer h-full">
                  <div className="doppel-inner p-8 h-full flex flex-col">
                    <div className="flex gap-1 mb-5">
                      {[...Array(5)].map((_, j) => (
                        <svg key={j} className="w-3.5 h-3.5 text-[#5e6ad2]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8l-6.2 3.2L7 14.2 2 9.3l6.9-1L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-white/60 font-[425] leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[11px] font-semibold text-white/40">{t.initials}</div>
                      <div>
                        <div className="text-xs font-medium">{t.name}</div>
                        <div className="text-[11px] text-white/30">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 md:py-44 px-6">
        <div className="max-w-4xl mx-auto text-center motion-safe:animate-fade-up">
          <div className="doppel-outer">
            <div className="doppel-inner p-12 md:p-20 relative overflow-hidden">
              <div className="radial-glow top-[-30%] left-1/2 -translate-x-1/2 bg-[#5e6ad2]" />
              <div className="relative z-10">
                <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tighter leading-[0.9] mb-4">
                  Stop taking notes.<br />
                  <span className="text-white/20">Start selling.</span>
                </h2>
                <p className="text-white/30 mb-10 max-w-md mx-auto text-sm">
                  Join thousands of SDRs who eliminated manual note-taking. Free forever. No credit card.
                </p>
                {user ? (
                  <button onClick={() => setShowApp(true)}
                    className="btn-island flex items-center gap-3 bg-white text-[#050505] hover:bg-white/90 group mx-auto px-8 py-4">
                    Open App
                    <span className="icon-wrap bg-[#050505]/10 group-hover:bg-[#050505]/15">
                      <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ) : (
                  <SignInButton mode="modal">
                    <button className="btn-island flex items-center gap-3 bg-white text-[#050505] hover:bg-white/90 group mx-auto px-8 py-4">
                      Get Started Free
                      <span className="icon-wrap bg-[#050505]/10 group-hover:bg-[#050505]/15">
                        <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showApp && <AppInterface onClose={() => setShowApp(false)} />}
    </main>
  );
}