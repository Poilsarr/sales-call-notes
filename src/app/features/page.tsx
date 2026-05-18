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
  Users, Sparkles, ArrowRight, Zap, Cpu, Lock, Clock
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Upload, title: "Audio Upload", desc: "Drag-drop or click to upload MP3, WAV, M4A, WebM files. Process recordings instantly.", color: "#5e6ad2", size: "lg" },
  { icon: Mic, title: "AI Transcription", desc: "Powered by Whisper AI. Accurate speech-to-text with speaker identification support.", color: "#22d3a8", size: "sm" },
  { icon: Brain, title: "Smart Summarization", desc: "Extract 2-3 sentence summaries, action items, key decisions, and next steps automatically.", color: "#8b5cf6", size: "sm" },
  { icon: Target, title: "Action Item Extraction", desc: "Identify tasks, owners, and due dates from every call. Never miss a follow-up.", color: "#f59e0b", size: "md" },
  { icon: Share2, title: "One-Click CRM Export", desc: "Copy formatted notes for HubSpot, Salesforce, or Microsoft Teams in one click.", color: "#3b82f6", size: "md" },
  { icon: BarChart3, title: "Call Analytics", desc: "Track health scores, sentiment, talk ratios, budget signals, and decision-maker presence.", color: "#ec4899", size: "lg" },
  { icon: Users, title: "Speaker Diarization", desc: "Automatic speaker labeling so you know exactly who said what during the conversation.", color: "#14b8a6", size: "sm" },
  { icon: Search, title: "Searchable History", desc: "Full call archive with search and filter by date, customer, or keywords.", color: "#6366f1", size: "sm" },
  { icon: Shield, title: "Local Processing", desc: "AI runs locally by default. Your call data never leaves your machine.", color: "#10b981", size: "md" },
  { icon: Globe, title: "Multi-Language", desc: "Transcribe and analyze calls in English, Spanish, French, German, and more.", color: "#f97316", size: "sm" },
  { icon: Download, title: "JSON Export", desc: "Export structured data for API integrations and custom workflows.", color: "#a855f7", size: "sm" },
  { icon: Layers, title: "Team Dashboard", desc: "Manager view of all team calls with aggregated analytics and performance metrics.", color: "#06b6d4", size: "md" },
];

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number; c: string }[] = [];
    const colors = ["rgba(94,106,210,", "rgba(34,211,168,", "rgba(139,92,246,"];

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
            ctx.strokeStyle = `rgba(94,106,210,${0.04 * (1 - dist / 120)})`;
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
    <div ref={iconRef} className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500"
      style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
      <Icon strokeWidth={1} className="w-5 h-5" style={{ color }} />
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
    glowRef.current.style.background = `radial-gradient(600px circle at ${x}% ${y}%, ${feature.color}18, transparent 40%)`;
  }, [feature.color]);

  const sizeClasses: Record<string, string> = {
    sm: "md:col-span-1",
    md: "md:col-span-1",
    lg: "md:col-span-2",
  };

  return (
    <div className={`${sizeClasses[feature.size]} reveal-card`}
      style={{ opacity: 0, transform: "translateY(60px) rotateX(8deg)" }}>
      <div
        ref={cardRef}
        className="group relative h-full cursor-default rounded-[2rem] overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          transition: "border-color 0.6s ease",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div ref={glowRef} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-all duration-700"
          style={{ background: `linear-gradient(90deg, transparent, ${feature.color}50, transparent)` }} />

        <div className="relative p-8 md:p-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-6">
            <AnimatedIcon Icon={feature.icon} color={feature.color} isActive={isVisible} />
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium px-3 py-1.5 rounded-full"
              style={{ color: feature.color, background: `${feature.color}08`, border: `1px solid ${feature.color}15` }}>
              <div className="w-1 h-1 rounded-full" style={{ background: feature.color }} />
              {index < 4 ? "Core" : index < 8 ? "Analytics" : "Export"}
            </div>
          </div>

          <h3 className="font-display font-semibold tracking-tight text-lg md:text-xl mb-3"
            style={{ color: isHovered ? "#fff" : "rgba(255,255,255,0.85)" }}>
            {feature.title}
          </h3>
          <p className="text-sm text-white/35 font-[425] leading-relaxed flex-1">{feature.desc}</p>

          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-white/20 uppercase tracking-[0.15em] font-medium">Feature {String(index + 1).padStart(2, "0")}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-white/20 group-hover:text-white/40 transition-colors duration-500">
              <span>Learn more</span>
              <ArrowRight strokeWidth={1} className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;
    const stats = sectionRef.current.querySelectorAll(".stat-item");
    gsap.fromTo(stats, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, stagger: 0.15, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
    });
  }, { scope: sectionRef });

  const stats = [
    { value: "60s", label: "Avg. processing time", icon: Clock },
    { value: "98%", label: "Transcription accuracy", icon: Target },
    { value: "12+", label: "Languages supported", icon: Globe },
    { value: "10+", label: "CRM integrations", icon: Share2 },
  ];

  return (
    <div ref={sectionRef} className="py-24 md:py-32 px-6">
      <div ref={statsRef} className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="stat-item text-center">
            <div className="doppel-outer">
              <div className="doppel-inner p-8 flex flex-col items-center">
                <s.icon strokeWidth={1} className="w-5 h-5 text-white/20 mb-4" />
                <div className="font-display text-3xl md:text-4xl font-semibold tracking-tighter text-white mb-1">{s.value}</div>
                <div className="text-[11px] text-white/30 font-medium">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
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

  const steps = [
    { num: "01", title: "Upload", desc: "Drop your call recording", icon: Upload, color: "#5e6ad2" },
    { num: "02", title: "Transcribe", desc: "Whisper AI converts speech to text", icon: Mic, color: "#22d3a8" },
    { num: "03", title: "Analyze", desc: "Extract insights & action items", icon: Brain, color: "#8b5cf6" },
    { num: "04", title: "Export", desc: "Push to CRM or download", icon: Share2, color: "#3b82f6" },
  ];

  return (
    <div ref={sectionRef} className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="eyebrow inline-flex items-center gap-2 mb-6">
            <Zap strokeWidth={1} className="w-3 h-3" /> How it works
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tighter leading-[0.9]">
            Four steps to <span className="text-white/20">zero notes</span>
          </h2>
        </div>

        <div className="relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px workflow-line origin-top"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(94,106,210,0.3), transparent)" }} />

          <div className="space-y-12 md:space-y-16">
            {steps.map((s, i) => (
              <div key={i} className={`workflow-step relative flex items-center gap-6 md:gap-12 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                <div className={`flex-1 ${i % 2 === 1 ? "md:text-right" : ""}`}>
                  <div className="doppel-outer inline-block">
                    <div className="doppel-inner p-6 md:p-8">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `${s.color}12`, border: `1px solid ${s.color}20` }}>
                          <s.icon strokeWidth={1} className="w-5 h-5" style={{ color: s.color }} />
                        </div>
                        <span className="font-mono text-[10px] text-white/20 font-medium">{s.num}</span>
                      </div>
                      <h3 className="font-display text-xl font-semibold tracking-tight mb-1">{s.title}</h3>
                      <p className="text-sm text-white/35">{s.desc}</p>
                    </div>
                  </div>
                </div>

                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full z-10"
                  style={{ background: s.color, boxShadow: `0 0 20px ${s.color}60` }} />

                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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
      opacity: 1,
      y: 0,
      rotateX: 0,
      stagger: 0.08,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: gridRef.current,
        start: "top 75%",
      },
    });
  }, { scope: gridRef });

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-[#5e6ad2]/30">
      <Nav />

      <section ref={heroRef} className="relative min-h-[80dvh] flex flex-col items-center justify-center px-6 pt-32 pb-32 mesh-bg">
        <ParticleCanvas />
        <div className="radial-glow top-[-10%] left-[10%] bg-[#5e6ad2]" />
        <div className="radial-glow bottom-[-10%] right-[5%] bg-[#22d3a8]" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="hero-eyebrow eyebrow inline-flex items-center gap-2 mb-8">
            <Sparkles strokeWidth={1} className="w-3 h-3" /> Everything you need
          </div>
          <h1 className="hero-title font-display text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[0.85] mb-6">
            Features built for<br />
            <span className="text-white/20">the modern SDR</span>
          </h1>
          <p className="hero-subtitle text-base md:text-lg text-white/30 max-w-2xl mx-auto font-[425] leading-relaxed mb-10">
            From transcription to CRM export, CallNote Pro handles the entire sales call workflow.
            No bots. No complex setup. Just results.
          </p>
          <div className="hero-badge inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/40">
            <Cpu strokeWidth={1} className="w-3.5 h-3.5 text-[#5e6ad2]" />
            <span>12 features</span>
            <span className="text-white/15">|</span>
            <Lock strokeWidth={1} className="w-3.5 h-3.5 text-[#22d3a8]" />
            <span>SOC 2 compliant</span>
          </div>
        </div>
      </section>

      <section ref={gridRef} className="py-24 md:py-32 px-6 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(94,106,210,0.06) 0%, transparent 60%)" }} />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <FeatureCard key={i} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      <StatsSection />
      <WorkflowSection />

      <section className="pb-32 md:pb-44 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="doppel-outer group">
            <div className="doppel-inner p-12 md:p-20 relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(94,106,210,0.08), transparent 70%)" }} />
              <div className="relative z-10">
                <div className="eyebrow inline-flex items-center gap-2 mb-6">
                  <Zap strokeWidth={1} className="w-3 h-3" /> Start today
                </div>
                <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tighter leading-[0.9] mb-4">
                  Ready to save hours every week?
                </h2>
                <p className="text-white/30 mb-10 text-sm">Join SDRs who cut their note-taking time by 80%.</p>
                <Link href="/"
                  className="btn-island inline-flex items-center gap-3 bg-white text-[#050505] hover:bg-white/90 group px-8 py-4">
                  Get Started Free
                  <span className="icon-wrap bg-[#050505]/10 group-hover:bg-[#050505]/15">
                    <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5" />
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
