"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Nav from "@/components/nav";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Mic, FileText, Brain, Target, Share2, BarChart3,
  Upload, Layers, Shield, Globe, Download, Search,
  Users, Sparkles, ArrowRight, Zap, Cpu, Lock, Clock,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Upload, title: "Audio Upload", desc: "Drag-drop or click to upload MP3, WAV, M4A, WebM files. Process recordings instantly.", color: "#F26522", size: "lg" },
  { icon: Mic, title: "AI Transcription", desc: "Powered by Whisper AI. Accurate speech-to-text with speaker identification support.", color: "#2563eb", size: "sm" },
  { icon: Brain, title: "Smart Summarization", desc: "Extract 2-3 sentence summaries, action items, key decisions, and next steps automatically.", color: "#7c3aed", size: "sm" },
  { icon: Target, title: "Action Item Extraction", desc: "Identify tasks, owners, and due dates from every call. Never miss a follow-up.", color: "#d97706", size: "md" },
  { icon: Share2, title: "One-Click CRM Export", desc: "Copy formatted notes for HubSpot, Salesforce, or Microsoft Teams in one click.", color: "#059669", size: "md" },
  { icon: BarChart3, title: "Call Analytics", desc: "Track health scores, sentiment, talk ratios, budget signals, and decision-maker presence.", color: "#dc2626", size: "lg" },
  { icon: Users, title: "Speaker Diarization", desc: "Automatic speaker labeling so you know exactly who said what during the conversation.", color: "#0891b2", size: "sm" },
  { icon: Search, title: "Searchable History", desc: "Full call archive with search and filter by date, customer, or keywords.", color: "#4f46e5", size: "sm" },
  { icon: Shield, title: "Local Processing", desc: "AI runs locally by default. Your call data never leaves your machine.", color: "#059669", size: "md" },
  { icon: Globe, title: "Multi-Language", desc: "Transcribe and analyze calls in English, Spanish, French, German, and more.", color: "#ea580c", size: "sm" },
  { icon: Download, title: "JSON Export", desc: "Export structured data for API integrations and custom workflows.", color: "#9333ea", size: "sm" },
  { icon: Layers, title: "Team Dashboard", desc: "Manager view of all team calls with aggregated analytics and performance metrics.", color: "#0891b2", size: "md" },
];

const statsData = [
  { value: "60s", label: "Avg. processing time", icon: Clock },
  { value: "98%", label: "Transcription accuracy", icon: Target },
  { value: "12+", label: "Languages supported", icon: Globe },
  { value: "10+", label: "CRM integrations", icon: Share2 },
];

const steps = [
  { num: "01", title: "Upload", desc: "Drop your call recording", icon: Upload, color: "#F26522" },
  { num: "02", title: "Transcribe", desc: "Whisper AI converts speech to text", icon: Mic, color: "#2563eb" },
  { num: "03", title: "Analyze", desc: "Extract insights & action items", icon: Brain, color: "#7c3aed" },
  { num: "04", title: "Export", desc: "Push to CRM or download", icon: Share2, color: "#059669" },
];

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const colors = ["rgba(242,101,34,", "rgba(37,99,235,", "rgba(124,58,237,"];
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number; c: string }[] = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.3 + 0.05,
        c: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c + p.o + ")";
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(242,101,34,${0.04 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

function AnimatedIcon({ Icon, color, isActive }: { Icon: any; color: string; isActive: boolean }) {
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!iconRef.current || !isActive) return;
    const tl = gsap.timeline();
    tl.fromTo(iconRef.current, { rotateY: 180, scale: 0.5, opacity: 0 }, { rotateY: 0, scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)" })
      .to(iconRef.current, { boxShadow: `0 0 30px ${color}30`, duration: 0.4 }, 0);
    return () => { tl.kill(); };
  }, [isActive, color]);

  return (
    <div ref={iconRef} className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500"
      style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
      <Icon strokeWidth={1.5} className="w-5 h-5" style={{ color }} />
    </div>
  );
}

function WaveformToText({ color, isHovered }: { color: string; isHovered: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement[]>([]);
  const textRef = useRef<HTMLDivElement>(null);
  const barCount = 24;

  useEffect(() => {
    if (!isHovered) {
      barsRef.current.forEach(bar => {
        if (bar) gsap.to(bar, { height: 4, duration: 0.3, ease: "power2.out" });
      });
      if (textRef.current) gsap.set(textRef.current, { opacity: 0, y: 10 });
      return;
    }

    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      const h = Math.random() * 28 + 8;
      gsap.to(bar, {
        height: h, duration: 0.15, delay: i * 0.06, ease: "power2.out",
        onComplete: () => {
          if (i === barCount - 1) {
            gsap.to(barsRef.current.filter(Boolean), { opacity: 0, duration: 0.3, stagger: 0.02, ease: "power2.in" });
            if (textRef.current) {
              gsap.to(textRef.current, { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: "power3.out" });
            }
          }
        },
      });
    });
  }, [isHovered]);

  return (
    <div ref={containerRef} className="h-14 flex items-center justify-center relative overflow-hidden rounded-xl"
      style={{ background: `${color}06`, border: `1px solid ${color}15` }}>
      <div className="flex items-center gap-[3px] absolute inset-0 justify-center">
        {Array.from({ length: barCount }).map((_, i) => (
          <div key={i} ref={el => { barsRef.current[i] = el!; }}
            className="rounded-full" style={{ width: 2, height: 4, background: color, opacity: 0.5 }} />
        ))}
      </div>
      <div ref={textRef} className="relative z-10 font-mono text-[11px] tracking-wider whitespace-nowrap"
        style={{ color, opacity: 0, transform: "translateY(10px)" }}>
        <span className="opacity-50">Speaker 1:</span> &quot;Let me walk you through...&quot;
      </div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!cardRef.current) return;
    const trigger = ScrollTrigger.create({
      trigger: cardRef.current,
      start: "top 85%",
      onEnter: () => setIsVisible(true),
    });
    return () => trigger.kill();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !glowRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    glowRef.current.style.background = `radial-gradient(600px circle at ${x}% ${y}%, ${feature.color}15, transparent 40%)`;
  }, [feature.color]);

  const sizeClasses: Record<string, string> = { sm: "md:col-span-1", md: "md:col-span-1", lg: "md:col-span-2" };
  const isTranscription = index === 1;

  return (
    <div className={`${sizeClasses[feature.size]} reveal-card`}
      style={{ opacity: 0, transform: "translateY(60px) rotateX(8deg)" }}>
      <div ref={cardRef}
        className="group relative h-full cursor-default rounded-[2rem] overflow-hidden doppel-outer"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div ref={glowRef} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[2rem]" />
        <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-all duration-700"
          style={{ background: `linear-gradient(90deg, transparent, ${feature.color}40, transparent)` }} />
        <div className="doppel-inner p-6 sm:p-8 md:p-10 h-full flex flex-col relative">
          <div className="flex items-start justify-between mb-5">
            <AnimatedIcon Icon={feature.icon} color={feature.color} isActive={isVisible} />
            <span className="text-[10px] font-mono font-medium px-3 py-1.5 rounded-full"
              style={{ color: feature.color, background: `${feature.color}08`, border: `1px solid ${feature.color}15` }}>
              {index < 4 ? "Core" : index < 8 ? "Analytics" : "Export"}
            </span>
          </div>

          <h3 className={`font-semibold tracking-tight mb-2 text-gray-900 ${isTranscription ? "text-[15px] md:text-[17px]" : "text-[15px]"}`}>
            {feature.title}
          </h3>

          {isTranscription ? (
            <div className="flex-1 flex flex-col gap-3">
              <p className="text-[13px] text-gray-500 leading-relaxed">{feature.desc}</p>
              <WaveformToText color={feature.color} isHovered={isHovered} />
            </div>
          ) : (
            <p className="text-[13px] text-gray-500 leading-relaxed flex-1">{feature.desc}</p>
          )}

          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-medium">Feature {String(index + 1).padStart(2, "0")}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 group-hover:text-gray-600 transition-colors duration-500">
              <span>Learn more</span>
              <ArrowRight strokeWidth={1.5} className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;
    const stats = sectionRef.current.querySelectorAll(".stat-item");
    gsap.fromTo(stats, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, stagger: 0.15, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12 bg-[#F5F5F5]">
      <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {statsData.map((s, i) => (
          <div key={i} className="stat-item text-center">
            <div className="doppel-outer">
              <div className="doppel-inner p-6 sm:p-8 flex flex-col items-center">
                <s.icon strokeWidth={1.5} className="w-5 h-5 text-[#F26522] mb-3" />
                <div className="text-[clamp(1.5rem,3vw,2.5rem)] font-semibold tracking-tighter text-gray-900 mb-1">{s.value}</div>
                <div className="text-[12px] text-gray-500 font-medium">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkflowSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;
    const steps = sectionRef.current.querySelectorAll(".workflow-step");
    const line = sectionRef.current.querySelector(".workflow-line");

    gsap.fromTo(steps, { opacity: 0, x: -30 }, {
      opacity: 1, x: 0, stagger: 0.2, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
    });

    if (line) {
      gsap.fromTo(line, { scaleY: 0 }, {
        scaleY: 1, duration: 1.2, ease: "power2.inOut",
        scrollTrigger: { trigger: sectionRef.current, start: "top 60%", end: "bottom 40%", scrub: 1 },
      });
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center mb-14">
          <div className="eyebrow inline-flex items-center gap-2 mb-5">
            <Zap size={12} /> How it works
          </div>
          <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em]">
            Four steps to <span className="text-gray-400">zero notes</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px workflow-line origin-top"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(242,101,34,0.2), transparent)" }} />

          <div className="space-y-10 md:space-y-14">
            {steps.map((s, i) => (
              <div key={i} className={`workflow-step relative flex items-center gap-6 md:gap-12 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                <div className={`flex-1 ${i % 2 === 1 ? "md:text-right" : ""}`}>
                  <div className="doppel-outer inline-block">
                    <div className="doppel-inner p-5 sm:p-6 md:p-8">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `${s.color}10`, border: `1px solid ${s.color}20` }}>
                          <s.icon size={18} style={{ color: s.color }} strokeWidth={1.5} />
                        </div>
                        <span className="font-mono text-[10px] text-gray-400 font-medium">{s.num}</span>
                      </div>
                      <h3 className="text-[15px] sm:text-[17px] font-semibold tracking-tight mb-1 text-gray-900">{s.title}</h3>
                      <p className="text-[13px] text-gray-500">{s.desc}</p>
                    </div>
                  </div>
                </div>

                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full z-10"
                  style={{ background: s.color, boxShadow: `0 0 20px ${s.color}40` }} />

                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!heroRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(heroRef.current.querySelector(".hero-eyebrow"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.2)
      .fromTo(heroRef.current.querySelector(".hero-title"), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.3)
      .fromTo(heroRef.current.querySelector(".hero-subtitle"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.5)
      .fromTo(heroRef.current.querySelector(".hero-badge"), { y: 16, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.6 }, 0.7);
  }, { scope: heroRef });

  useGSAP(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll(".reveal-card");
    gsap.to(cards, {
      opacity: 1, y: 0, rotateX: 0, stagger: 0.08, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: gridRef.current, start: "top 75%" },
    });
  }, { scope: gridRef });

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-hidden selection:bg-[#F26522]/20">
      <Nav />

      <section ref={heroRef} className="relative min-h-[80dvh] flex flex-col items-center justify-center px-5 sm:px-8 lg:px-12 pt-32 pb-32 bg-[#EFEFEF] overflow-hidden">
        <ParticleCanvas />
        <div className="radial-glow top-[-10%] left-[10%]" style={{ background: "#F26522" }} />
        <div className="radial-glow bottom-[-10%] right-[5%]" style={{ background: "#2563eb" }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="hero-eyebrow eyebrow inline-flex items-center gap-2 mb-8">
            <Sparkles size={12} /> Everything you need
          </div>
          <h1 className="hero-title text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-5">
            Features built for<br />
            <span className="text-gray-400">the modern SDR</span>
          </h1>
          <p className="hero-subtitle text-[14px] sm:text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
            From transcription to CRM export, CallNote Pro handles the entire sales call workflow.
            No bots. No complex setup. Just results.
          </p>
          <div className="hero-badge inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-gray-200 text-[12px] text-gray-500">
            <Cpu size={14} className="text-[#F26522]" />
            <span>12 features</span>
            <span className="text-gray-300">|</span>
            <Lock size={14} className="text-[#2563eb]" />
            <span>SOC 2 compliant</span>
          </div>
        </div>
      </section>

      <section ref={gridRef} className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(242,101,34,0.04) 0%, transparent 60%)" }} />
        <div className="max-w-[1440px] mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <FeatureCard key={i} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      <StatsSection />
      <WorkflowSection />

      <section className="pb-16 sm:pb-20 lg:pb-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="doppel-outer group">
            <div className="doppel-inner p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(242,101,34,0.06), transparent 70%)" }} />
              <div className="relative z-10">
                <div className="eyebrow inline-flex items-center gap-2 mb-5">
                  <Zap size={12} /> Start today
                </div>
                <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3">
                  Ready to save hours every week?
                </h2>
                <p className="text-gray-500 mb-8 text-[14px]">Join SDRs who cut their note-taking time by 80%.</p>
                <Link href="/sign-up"
                  className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300">
                  <span className="flex flex-col overflow-hidden h-[20px]">
                    <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                      Get Started Free
                    </span>
                    <span className="leading-[20px]">Get Started Free</span>
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
