"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import Nav from "@/components/nav";
import Link from "next/link";
import {
  Upload, Brain, Target, BarChart3,
  Share2, History, ArrowRight, Sparkles,
} from "lucide-react";

const AppInterface = dynamic(() => import("@/components/app-interface"), { ssr: false });
const HeroShader = dynamic(() => import("@/components/hero-shader"), { ssr: false });

const features = [
  { icon: Upload, title: "Audio Upload", desc: "Drag-drop or click to upload MP3, WAV, M4A, WebM. Process recordings instantly.", accent: "#F26522", metric: "Instant" },
  { icon: Brain, title: "Precision Transcription", desc: "Whisper AI powered. Clean speaker separation. Accurate labels for every turn.", accent: "#2563eb", metric: "99% Acc" },
  { icon: Target, title: "Smart Summarization", desc: "Extract 2-3 sentence summaries, action items, key decisions automatically.", accent: "#7c3aed", metric: "AI" },
  { icon: BarChart3, title: "Call Analytics", desc: "Track health scores, sentiment, talk ratios, budget signals, and next steps.", accent: "#059669", metric: "Live" },
  { icon: Share2, title: "One-Click CRM Export", desc: "Push MEDDIC/BANT summaries to HubSpot, Salesforce, or Teams.", accent: "#d97706", metric: "3 CRMs" },
  { icon: History, title: "Searchable History", desc: "Full archive with semantic search across all your calls and insights.", accent: "#dc2626", metric: "∞ storage" },
];

const testimonials = [
  { quote: "I easily save hours per week, without a doubt. That's an exponential amount of time savings.", name: "Matt S.", role: "Marketing Manager", initials: "MS" },
  { quote: "Just being conservative — our team is getting 33% time back from manual note-taking.", name: "Laura B.", role: "VP of Sales", initials: "LB" },
  { quote: "Cut my post-call documentation from 15 minutes to 30 seconds. It's a superpower.", name: "Brandon S.", role: "Sales Enablement", initials: "BS" },
];

export default function Home() {
  const [showApp, setShowApp] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        document.querySelectorAll(".glow-card").forEach((card) => {
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

  return (
    <main className="min-h-screen bg-[#EFEFEF] text-gray-900 overflow-hidden">
      {/* SECTION 1: HERO */}
      <section className="relative min-h-[100dvh] flex flex-col">
        <HeroShader />
        <Nav />

        <div className="flex-1" />

        <div className="relative z-20 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pb-14 sm:pb-16 lg:pb-20">
          <p className="text-[13px] leading-[14px] text-gray-900 tracking-wide mb-5 sm:mb-8 motion-safe:animate-fade-up">
            CallNote Pro
          </p>
          <h1 className="text-[clamp(1.75rem,7vw,4.2rem)] sm:text-[clamp(2.5rem,5vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 motion-safe:animate-fade-up motion-safe:[animation-delay:100ms]">
            Sales call notes,<br className="hidden sm:block" />
            <span className="sm:hidden"> </span>rendered instant.
          </h1>
          <p className="text-[15px] text-gray-500 max-w-lg mt-4 mb-8 motion-safe:animate-fade-up motion-safe:[animation-delay:200ms]">
            Upload your call recording. Get summary, action items, and CRM-ready notes in seconds.
            Built for the modern SDR. No bots, no complex setup.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 motion-safe:animate-fade-up motion-safe:[animation-delay:300ms]">
            {user ? (
              <button onClick={() => setShowApp(true)}
                className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] sm:text-[14px] rounded-full pl-5 sm:pl-6 pr-2 py-2 transition-colors duration-300">
                <span className="flex flex-col overflow-hidden h-[20px]">
                  <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                    Open App
                  </span>
                  <span className="leading-[20px]">Open App</span>
                </span>
                <span className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                  <ArrowRight size={14} className="text-[#F26522]" />
                </span>
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] sm:text-[14px] rounded-full pl-5 sm:pl-6 pr-2 py-2 transition-colors duration-300">
                  <span className="flex flex-col overflow-hidden h-[20px]">
                    <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                      Get Started Free
                    </span>
                    <span className="leading-[20px]">Get Started Free</span>
                  </span>
                  <span className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                    <ArrowRight size={14} className="text-[#F26522]" />
                  </span>
                </button>
              </SignInButton>
            )}
            <button onClick={() => setShowApp(true)}
              className="group inline-flex items-center gap-2 bg-white text-gray-600 hover:text-gray-900 text-[13px] rounded-full pl-5 pr-2 py-2 border border-gray-200 hover:border-gray-300 transition-all duration-300">
              <span className="flex flex-col overflow-hidden h-[20px]">
                <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                  View Demo
                </span>
                <span className="leading-[20px]">View Demo</span>
              </span>
              <span className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                <ArrowRight size={14} className="text-gray-500" />
              </span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-float motion-safe:animate-fade-up motion-safe:[animation-delay:500ms]">
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* SECTION 2: FEATURES */}
      <section className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center mb-14 motion-safe:animate-fade-up">
            <div className="eyebrow inline-flex mb-5">Capabilities</div>
            <h2 className="text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-gray-900 mb-3">
              Everything an SDR needs
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-[14px]">From upload to CRM export in under 60 seconds. No learning curve.</p>
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F26522]" />
                <span>AI-powered</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                <span>CRM ready</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
                <span>Free forever</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div key={i} className={`motion-safe:animate-fade-up ${i === 0 ? "md:col-span-2" : ""}`}
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                <div className="glow-card group relative h-full">
                  <div className="doppel-outer h-full relative">
                    <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                      style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${f.accent}15, transparent 40%)` }} />
                    <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                      style={{ background: `linear-gradient(90deg, transparent, ${f.accent}40, transparent)` }} />
                    <div className="doppel-inner p-6 sm:p-8 md:p-10 h-full flex flex-col relative">
                      <div className="flex items-start justify-between mb-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 0 ? "md:w-12 md:h-12" : ""}`}
                          style={{ background: `${f.accent}10` }}>
                          <f.icon size={i === 0 ? 22 : 18} style={{ color: f.accent }} strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full"
                          style={{ color: f.accent, background: `${f.accent}08` }}>
                          {f.metric}
                        </span>
                      </div>
                      <h3 className={`font-semibold tracking-tight text-gray-900 mb-2 ${i === 0 ? "text-[18px] md:text-[20px]" : "text-[15px]"}`}>{f.title}</h3>
                      <p className="text-[13px] text-gray-500 leading-relaxed max-w-md">{f.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 motion-safe:animate-fade-up" style={{ animationDelay: "0.6s" }}>
            <Link href="/features"
              className="inline-flex items-center gap-2 text-[12px] text-gray-400 hover:text-gray-900 transition-all duration-300 px-5 py-2.5 rounded-full border border-gray-200 hover:border-gray-300">
              View all features
              <ArrowRight size={12} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 3: TESTIMONIALS */}
      <section className="bg-[#F5F5F5] pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center mb-14 motion-safe:animate-fade-up">
            <div className="eyebrow inline-flex mb-5">Testimonials</div>
            <h2 className="text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-gray-900">
              Trusted by SDR teams
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="motion-safe:animate-fade-up" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
                <div className="doppel-outer h-full">
                  <div className="doppel-inner p-6 sm:p-8 h-full flex flex-col">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <svg key={j} className="w-3.5 h-3.5 text-[#F26522]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8l-6.2 3.2L7 14.2 2 9.3l6.9-1L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-500">{t.initials}</div>
                      <div>
                        <div className="text-[12px] font-semibold text-gray-900">{t.name}</div>
                        <div className="text-[11px] text-gray-500">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: CTA */}
      <section className="bg-white py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="doppel-outer group">
            <div className="doppel-inner p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(242,101,34,0.06), transparent 70%)" }} />
              <div className="relative z-10">
                <h2 className="text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3">
                  Stop taking notes.<br />
                  <span className="text-gray-400">Start selling.</span>
                </h2>
                <p className="text-gray-500 mb-8 text-[14px]">Join thousands of SDRs who eliminated manual note-taking. Free forever. No credit card.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {user ? (
                    <button onClick={() => setShowApp(true)}
                      className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300">
                      <span className="flex flex-col overflow-hidden h-[20px]">
                        <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                          Open App
                        </span>
                        <span className="leading-[20px]">Open App</span>
                      </span>
                      <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                        <ArrowRight size={14} className="text-[#F26522]" />
                      </span>
                    </button>
                  ) : (
                    <SignInButton mode="modal">
                      <button className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300">
                        <span className="flex flex-col overflow-hidden h-[20px]">
                          <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                            Get Started Free
                          </span>
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
        </div>
      </section>

      {mounted && showApp && <AppInterface onClose={() => setShowApp(false)} />}
    </main>
  );
}
