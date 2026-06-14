"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Nav from "@/components/nav";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Upload, Brain, Target, BarChart3,
  Share2, History, ArrowRight, Sparkles,
  Zap, CheckCircle, Activity,
} from "lucide-react";

const AppInterface = dynamic(() => import("@/components/app-interface"), { ssr: false });

const features = [
  { icon: Upload, title: "Audio Upload", desc: "Drag-drop or click to upload MP3, WAV, M4A, WebM. Process recordings instantly.", metric: "Instant" },
  { icon: Brain, title: "Precision Transcription", desc: "Whisper AI powered. Clean speaker separation. Accurate labels for every turn.", metric: "99% Acc" },
  { icon: Target, title: "Smart Summarization", desc: "Extract 2-3 sentence summaries, action items, key decisions automatically.", metric: "AI" },
  { icon: BarChart3, title: "Call Analytics", desc: "Track health scores, sentiment, talk ratios, budget signals, and next steps.", metric: "Live" },
  { icon: Share2, title: "One-Click CRM Export", desc: "Push MEDDIC/BANT summaries to HubSpot, Salesforce, or Teams.", metric: "3 CRMs" },
  { icon: History, title: "Searchable History", desc: "Full archive with semantic search across all your calls and insights.", metric: "∞ storage" },
];

const testimonials = [
  { quote: "I easily save hours per week, without a doubt. That's an exponential amount of time savings.", name: "Matt S.", role: "Marketing Manager", initials: "MS" },
  { quote: "Just being conservative — our team is getting 33% time back from manual note-taking.", name: "Laura B.", role: "VP of Sales", initials: "LB" },
  { quote: "Cut my post-call documentation from 15 minutes to 30 seconds. It's a superpower.", name: "Brandon S.", role: "Sales Enablement", initials: "BS" },
];

const stats = [
  { label: "Accuracy", value: "99%", icon: CheckCircle },
  { label: "CRM Sync", value: "3", icon: Zap },
  { label: "Calls Processed", value: "10K+", icon: Activity },
];

const barHeights = [12, 22, 36, 18, 28, 15, 30, 42, 20, 25, 35, 18, 22, 40, 28, 15, 32, 24, 38, 20, 16, 26, 34, 22, 30, 18, 36, 14, 28, 32];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function Home() {
  const router = useRouter();
  const [showApp, setShowApp] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => setMounted(true), []);

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden">
      <div className="noise-overlay" />

      {/* HERO */}
      <section className="relative min-h-[100dvh] flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(242,101,34,0.12),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(242,101,34,0.06),transparent_50%)]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#F26522] opacity-[0.04] blur-[120px] pointer-events-none" />
        </div>

        <Nav />

        <div className="flex-1 relative z-10 flex items-center">
          <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-24 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F26522] animate-pulse" />
                <span className="text-[11px] text-gray-400 tracking-wide">AI-Powered Call Intelligence</span>
              </div>

              <h1 className="text-[clamp(2rem,6vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.04em] mb-4">
                <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                  Sales call notes,
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#F26522] via-orange-400 to-[#F26522] bg-clip-text text-transparent">
                  rendered instant.
                </span>
              </h1>

              <p className="text-[15px] text-gray-400 max-w-lg mb-8 leading-relaxed">
                Upload your call recording. Get summary, action items, and CRM-ready notes in seconds.
                Built for the modern SDR. No bots, no complex setup.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 mb-12">
                {user ? (
                  <Link href="/app"
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
                  </Link>
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
                <Link href="/features"
                  className="group inline-flex items-center gap-2 bg-white/5 text-gray-300 hover:text-white text-[13px] rounded-full pl-5 pr-2 py-2 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <span className="flex flex-col overflow-hidden h-[20px]">
                    <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                      View Demo
                    </span>
                    <span className="leading-[20px]">View Demo</span>
                  </span>
                  <span className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                    <ArrowRight size={14} className="text-gray-400" />
                  </span>
                </Link>
              </div>

              <div className="flex flex-wrap gap-3">
                {stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={mounted ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 + i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                    className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2"
                  >
                    <s.icon size={14} className="text-[#F26522]" />
                    <span className="text-[13px] font-medium text-white">{s.value}</span>
                    <span className="text-[11px] text-gray-500">{s.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={mounted ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="hidden lg:flex items-center justify-center relative h-[500px]"
            >
              <div className="relative w-[280px]">
                <div className="absolute -inset-20 animate-[spin_20s_linear_infinite] opacity-30">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#F26522] shadow-[0_0_10px_#F26522]" />
                </div>
                <div className="absolute -inset-32 animate-[spin_30s_linear_infinite_reverse] opacity-20">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_15px_rgba(242,101,34,0.5)]" />
                </div>

                <div className="relative z-10 mx-auto w-[220px]">
                  <div className="rounded-[32px] bg-gradient-to-b from-gray-800 to-gray-900 p-[2px] shadow-[0_30px_80px_rgba(242,101,34,0.15)]">
                    <div className="rounded-[30px] bg-black overflow-hidden">
                      <div className="w-[80px] h-[6px] bg-gray-900 rounded-full mx-auto mt-3" />
                      <div className="p-4 pt-3 space-y-3">
                        <div className="flex items-end gap-[2px] h-16 justify-center">
                          {barHeights.map((h, i) => (
                            <div
                              key={i}
                              className="w-[3px] rounded-full bg-gradient-to-t from-[#F26522]/40 to-[#F26522]"
                              style={{
                                height: `${h}px`,
                                animation: `C-pulse ${0.5 + (i % 5) * 0.1}s ease-in-out infinite`,
                                animationDelay: `${i * 0.05}s`,
                              }}
                            />
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 rounded-full bg-white/5" style={{ width: "85%" }} />
                          <div className="h-2 rounded-full bg-white/5" style={{ width: "60%" }} />
                          <div className="h-2 rounded-full bg-white/[0.15]" style={{ width: "75%" }} />
                          <div className="h-2 rounded-full bg-white/5" style={{ width: "45%" }} />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <div className="w-4 h-4 rounded border border-[#F26522]/50 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-sm bg-[#F26522]" />
                          </div>
                          <div className="h-2 w-24 rounded-full bg-[#F26522]/20" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-10 -right-10 z-20">
                  <div className="w-16 h-16 rounded-full border-2 border-[#F26522]/40 bg-[#F26522]/5 absolute -top-8 -right-4 shadow-[0_0_30px_rgba(242,101,34,0.2)] animate-float" />
                  <div className="w-20 h-24 absolute top-4 right-0">
                    <div className="w-full h-full bg-gradient-to-b from-[#F26522]/10 to-transparent" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                  </div>
                  <div className="absolute top-8 right-[-60px]">
                    <div className="w-[80px] h-[1.5px] bg-gradient-to-r from-[#F26522] via-[#F26522]/60 to-transparent origin-left" style={{ transform: "rotate(-15deg)" }} />
                    <div className="absolute right-0 -top-[4px] w-2 h-2 rounded-full bg-[#F26522] shadow-[0_0_12px_#F26522]" />
                  </div>
                  <div className="absolute top-6 right-12 w-1.5 h-1.5 rounded-full bg-[#F26522]/60" />
                  <div className="absolute top-2 right-6 w-1 h-1 rounded-full bg-[#F26522]/30" />
                </div>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-16 top-16 z-20"
                >
                  <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5 shadow-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] text-gray-300 whitespace-nowrap">Active on call</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -right-20 bottom-20 z-20"
                >
                  <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5 shadow-lg">
                    <Sparkles size={12} className="text-[#F26522]" />
                    <span className="text-[11px] text-gray-300 whitespace-nowrap">AI Summary Ready</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -left-12 bottom-10 z-20"
                >
                  <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5 shadow-lg">
                    <span className="text-[11px] text-gray-300">95% Match</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
        >
          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#080808] to-[#050505]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />

        <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 mb-5">
              <span className="text-[10px] text-gray-400 tracking-[0.2em] uppercase">Capabilities</span>
            </div>
            <h2 className="text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-white mb-3">
              Everything an SDR needs
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-[14px]">From upload to CRM export in under 60 seconds. No learning curve.</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {features.map((f, i) => (
              <motion.div key={i} variants={itemVariants}
                className={`${i === 0 ? "md:col-span-2" : ""}`}
              >
                <div className="group relative h-full">
                  <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-b from-white/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative h-full rounded-[2rem] bg-white/[0.02] border border-white/[0.06] p-[1px]">
                    <div className="h-full rounded-[calc(2rem-2px)] bg-[#080808] p-6 sm:p-8 md:p-10">
                      <div className="flex items-start justify-between mb-5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5">
                          <f.icon size={i === 0 ? 22 : 18} className="text-[#F26522]" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full text-[#F26522] bg-[#F26522]/10">
                          {f.metric}
                        </span>
                      </div>
                      <h3 className={`font-semibold tracking-tight text-white mb-2 ${i === 0 ? "text-[18px] md:text-[20px]" : "text-[15px]"}`}>{f.title}</h3>
                      <p className="text-[13px] text-gray-500 leading-relaxed max-w-md">{f.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center mt-8"
          >
            <Link href="/features"
              className="inline-flex items-center gap-2 text-[12px] text-gray-500 hover:text-white transition-all duration-300 px-5 py-2.5 rounded-full border border-white/10 hover:border-white/20">
              View all features
              <ArrowRight size={12} strokeWidth={1.5} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#050505]" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 mb-5">
              <span className="text-[10px] text-gray-400 tracking-[0.2em] uppercase">Testimonials</span>
            </div>
            <h2 className="text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-white">
              Trusted by SDR teams
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={itemVariants}>
                <div className="h-full rounded-[2rem] bg-white/[0.02] border border-white/[0.06] p-6 sm:p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-3.5 h-3.5 text-[#F26522]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8l-6.2 3.2L7 14.2 2 9.3l6.9-1L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-[13px] text-gray-300 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/5">
                    <div className="w-8 h-8 rounded-full bg-[#F26522]/20 flex items-center justify-center text-[11px] font-semibold text-[#F26522]">{t.initials}</div>
                    <div>
                      <div className="text-[12px] font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-gray-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(242,101,34,0.08),transparent_60%)]" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center"
          >
            <h2 className="text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3">
              Stop taking notes.<br />
              <span className="text-gray-500">Start selling.</span>
            </h2>
            <p className="text-gray-500 mb-8 text-[14px] max-w-lg mx-auto">Join thousands of SDRs who eliminated manual note-taking. Free forever. No credit card.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link href="/app"
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
                </Link>
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
          </motion.div>
        </div>
      </section>

      {mounted && showApp && <AppInterface onClose={() => setShowApp(false)} />}
    </main>
  );
}
