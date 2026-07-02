"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Nav from "@/components/nav";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
import { featureContent } from "@/lib/feature-content";

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Upload, title: "Audio Upload", desc: "Drag-drop or click to upload MP3, WAV, M4A, WebM files. Process recordings instantly.", color: "#F26522", size: "lg", direction: "a" as const },
  { icon: Mic, title: "AI Transcription", desc: "Powered by Whisper AI. Accurate speech-to-text with speaker identification support.", color: "#2563eb", size: "sm", direction: "a" as const },
  { icon: Brain, title: "Smart Summarization", desc: "Extract 2-3 sentence summaries, action items, key decisions, and next steps automatically.", color: "#7c3aed", size: "sm", direction: "b" as const },
  { icon: Target, title: "Action Item Extraction", desc: "Identify tasks, owners, and due dates from every call. Never miss a follow-up.", color: "#d97706", size: "md", direction: "c" as const },
  { icon: Share2, title: "One-Click CRM Export", desc: "Copy formatted notes for HubSpot, Salesforce, or Microsoft Teams in one click.", color: "#059669", size: "md", direction: "b" as const },
  { icon: BarChart3, title: "Call Analytics", desc: "Track health scores, sentiment, talk ratios, budget signals, and decision-maker presence.", color: "#dc2626", size: "lg", direction: "c" as const },
  { icon: Users, title: "Speaker Diarization", desc: "Automatic speaker labeling so you know exactly who said what during the conversation.", color: "#0891b2", size: "sm", direction: "c" as const },
  { icon: Search, title: "Searchable History", desc: "Full call archive with search and filter by date, customer, or keywords.", color: "#4f46e5", size: "sm", direction: "a" as const },
  { icon: Shield, title: "Local Processing", desc: "AI runs locally by default. Your call data never leaves your machine.", color: "#059669", size: "md", direction: "a" as const },
  { icon: Globe, title: "Multi-Language", desc: "Transcribe and analyze calls in English, Spanish, French, German, and more.", color: "#ea580c", size: "sm", direction: "b" as const },
  { icon: Download, title: "JSON Export", desc: "Export structured data for API integrations and custom workflows.", color: "#9333ea", size: "sm", direction: "c" as const },
  { icon: Layers, title: "Team Dashboard", desc: "Manager view of all team calls with aggregated analytics and performance metrics.", color: "#0891b2", size: "md", direction: "c" as const },
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

const featureCategories = [
  { start: 0, end: 4, name: "Core Platform", id: "core-platform", desc: "The essential pipeline from raw audio to structured insights" },
  { start: 4, end: 8, name: "Analytics & Intelligence", id: "analytics-intelligence", desc: "Deep understanding of every customer conversation" },
  { start: 8, end: 12, name: "Enterprise & Security", id: "enterprise-security", desc: "Scale with confidence across your entire organization" },
];

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // ponytail: skip particle sim on mobile — 10k dist-checks/frame @60fps
    // is the dominant mobile cost on this page. viewport check at mount
    // is enough; user rarely flips between mobile/desktop mid-session.
    if (window.matchMedia("(max-width: 767px)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const colors = ["rgba(242,101,34,", "rgba(37,99,235,", "rgba(124,58,237,", "rgba(5,150,105,"];
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number; c: string; life: number }[] = [];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        o: Math.random() * 0.35 + 0.05,
        c: colors[Math.floor(Math.random() * colors.length)],
        life: Math.random() * 100 + 50,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.2;
        if (p.life <= 0) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.life = Math.random() * 100 + 50;
        }
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c + (p.o * Math.min(1, p.life / 50)) + ")";
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(242,101,34,${0.035 * (1 - dist / 140)})`;
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

function HeroMockup() {
  const mockupRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!mockupRef.current) return;
    gsap.fromTo(mockupRef.current,
      { y: 60, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, delay: 1, ease: "power3.out" }
    );
    // ponytail: yoyo float is desktop-only. matches GSAP's own matchMedia
    // pattern. mobile gets the static mockup, no infinite paint.
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      gsap.to(mockupRef.current, {
        y: -8, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2.2,
      });
    });
    return () => mm.revert();
  }, { scope: mockupRef });

  return (
    <div ref={mockupRef} className="w-full max-w-lg mx-auto mt-10 md:mt-14 opacity-0">
      <div className="doppel-outer shadow-xl shadow-black/5">
        <div className="doppel-inner p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-wider text-gray-400 font-medium uppercase">Live Transcription</span>
            <span className="ml-auto text-[9px] font-mono text-gray-300">00:00 / 12:34</span>
          </div>
          <div className="flex items-end gap-[2px] h-8 mb-4">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i}
                className="flex-1 rounded-full"
                style={{
                  height: `${Math.random() * 100 + 10}%`,
                  background: i < 16 ? "rgba(242,101,34,0.5)" : "rgba(37,99,235,0.3)",
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="shrink-0 text-[10px] font-mono font-medium text-[#F26522] bg-[#F26522]/8 px-2 py-0.5 rounded-full leading-none mt-0.5">
                Sarah
              </span>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                I wanted to walk you through our new pricing structure and see how it aligns with your current needs.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="shrink-0 text-[10px] font-mono font-medium text-[#2563eb] bg-[#2563eb]/8 px-2 py-0.5 rounded-full leading-none mt-0.5">
                John
              </span>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                That sounds good. What does the timeline look like for implementation?
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <Brain size={11} /> AI summary ready
            </span>
            <span className="flex items-center gap-1.5">
              <Target size={11} /> 3 action items found
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart3 size={11} /> Health: 8.4
            </span>
          </div>
        </div>
      </div>
    </div>
  );
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

function LearnMorePanel({ index, isOpen }: { index: number; isOpen: boolean }) {
  const content = featureContent[index + 1];
  if (!content) return null;
  return (
    <div
      className="grid transition-[grid-template-rows] duration-500 ease-out"
      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden">
        <div className="pt-5 mt-5 border-t border-gray-100 space-y-4">
          <p className="text-[12.5px] text-gray-700 leading-relaxed font-medium">
            {content.summary}
          </p>
          <ul className="space-y-2">
            {content.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[12px] text-gray-600 leading-relaxed">
                <Check strokeWidth={2} className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#F26522" }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {content.specs.map((s, i) => (
              <div key={i} className="bg-[#fafafa] border border-gray-200 rounded-lg px-2.5 py-2">
                <div className="text-[9px] font-mono uppercase tracking-[0.1em] text-gray-400 font-medium">
                  {s.label}
                </div>
                <div className="text-[11px] text-gray-900 mt-0.5 leading-snug font-medium">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {content.meta.map((m, i) => (
              <span key={i}
                className="inline-flex items-center gap-1.5 text-[10px] font-mono text-gray-500 bg-white border border-gray-200 rounded-full px-2.5 py-1">
                <span className="text-gray-400">{m.label}:</span>
                <span className="text-gray-900">{m.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isLarge = feature.size === "lg";

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
    if (!cardRef.current || !glowRef.current || !innerRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    glowRef.current.style.background = `radial-gradient(600px circle at ${x}% ${y}%, ${feature.color}15, transparent 40%)`;

    const rotateX = (y / 100 - 0.5) * -6;
    const rotateY = (x / 100 - 0.5) * 6;
    innerRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }, [feature.color]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (innerRef.current) {
      innerRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    }
  }, []);

  const sizeClasses: Record<string, string> = { sm: "md:col-span-1", md: "md:col-span-1", lg: "md:col-span-2" };
  const categoryLabel = index < 4 ? "Core" : index < 8 ? "Intelligence" : "Platform";
  const dirLabel = { a: "Studio", b: "Showstopper", c: "Engineering" }[feature.direction];

  const staggerDelay = `${(index % 4) * 0.08}s`;

  return (
    <div className={`${sizeClasses[feature.size]} reveal-card`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : "translateY(60px) rotateX(8deg)",
        transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}`,
      }}>
      <div ref={cardRef}
        className="group relative h-full cursor-default rounded-[2rem] overflow-hidden doppel-outer"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={glowRef} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[2rem]" />
        <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-all duration-700"
          style={{ background: `linear-gradient(90deg, transparent, ${feature.color}40, transparent)` }} />
        <div ref={innerRef}
          className="doppel-inner p-6 sm:p-8 md:p-10 h-full flex flex-col relative transition-transform duration-200 ease-out"
        >
          <div className="flex items-start justify-between mb-5">
            <AnimatedIcon Icon={feature.icon} color={feature.color} isActive={isVisible} />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-medium px-3 py-1.5 rounded-full"
                style={{ color: feature.color, background: `${feature.color}08`, border: `1px solid ${feature.color}15` }}>
                {categoryLabel}
              </span>
              {isLarge && (
                <span className="text-[10px] font-mono font-medium px-3 py-1.5 rounded-full bg-gray-900 text-white">
                  Featured
                </span>
              )}
            </div>
          </div>

          <h3 className={`font-semibold tracking-tight mb-2 text-gray-900 ${isLarge ? "text-[17px] md:text-[19px]" : "text-[15px]"}`}>
            {feature.title}
          </h3>

          <div
            className="rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative"
            style={{
              background: feature.direction === "c" ? "#fafafa" : `${feature.color}05`,
              border: `1px solid ${feature.direction === "c" ? "#e5e5e5" : `${feature.color}12`}`,
              height: isLarge ? "180px" : "150px",
            }}
          >
            <Feature3D index={index} color={feature.color} />
          </div>

          <p className="text-[13px] text-gray-500 leading-relaxed">{feature.desc}</p>

          <LearnMorePanel index={index} isOpen={isExpanded} />

          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-medium">Feature {String(index + 1).padStart(2, "0")}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsExpanded((v) => !v); }}
              className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-gray-700 transition-colors duration-300 cursor-pointer"
              aria-expanded={isExpanded}
            >
              <span className="font-mono uppercase tracking-[0.15em]">{isExpanded ? "Hide" : "Learn more"}</span>
              <ArrowRight
                strokeWidth={1.5}
                className={`w-3 h-3 transition-transform duration-500 ${isExpanded ? "rotate-90" : "group-hover:translate-x-1"}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedCounter({ value, label, icon: Icon }: { value: string; label: string; icon: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const num = parseFloat(value);
  const suffix = value.replace(/[\d.]/g, "");

  useGSAP(() => {
    if (!ref.current || !numRef.current) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: num,
      duration: 2.5,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 85%" },
      onUpdate: () => {
        if (numRef.current) {
          const formatted = Number.isInteger(num) ? Math.round(obj.val) : obj.val.toFixed(1);
          numRef.current.textContent = formatted + suffix;
        }
      },
    });
  }, []);

  return (
    <div ref={ref} className="stat-item text-center">
      <div className="doppel-outer group">
        <div className="doppel-inner p-6 sm:p-8 md:p-10 flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(242,101,34,0.04), transparent 70%)" }} />
          <div className="relative">
            <Icon strokeWidth={1.5} className="w-5 h-5 text-[#F26522] mb-3" />
            <div className="text-[clamp(1.75rem,3vw,2.75rem)] font-semibold tracking-tighter text-gray-900 mb-1">
              <span ref={numRef}>0{suffix}</span>
            </div>
            <div className="text-[12px] text-gray-500 font-medium">{label}</div>
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
    <section ref={sectionRef} className="relative py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(242,101,34,0.04) 0%, transparent 60%)" }} />
      <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 relative">
        {statsData.map((s, i) => (
          <AnimatedCounter key={i} value={s.value} label={s.label} icon={s.icon} />
        ))}
      </div>
    </section>
  );
}

function ComparisonSection() {
  // Honest competitor matrix. Public pricing pulled from each vendor's
  // public pricing page; "—" means the feature is not part of the listed
  // plan. Last reviewed 2026-06-22. Update on plan changes.
  const rows: { label: string; us: string; otter: string; fireflies: string; highlight?: boolean }[] = [
    { label: "Free tier", us: "300 min/mo forever", otter: "300 min/mo", fireflies: "800 min/mo" },
    { label: "Pro price", us: "$9/user/mo", otter: "$8.33/user/mo (annual)", fireflies: "$10/user/mo (annual)" },
    { label: "AI credits", us: "No credit pool", otter: "Limits on free", fireflies: "Shared 20–50 pool", highlight: true },
    { label: "Transcription model", us: "Whisper Large V3", otter: "Otter proprietary", fireflies: "Whisper + proprietary" },
    { label: "Languages", us: "Auto-detect", otter: "English + 3", fireflies: "69", highlight: true },
    { label: "Speaker labels", us: "Auto, per call", otter: "Auto, per call", fireflies: "Auto, per call" },
    { label: "Chrome extension (Meet)", us: "Live", otter: "Live", fireflies: "Live", highlight: true },
    { label: "Zapier (5,000+ apps)", us: "Live", otter: "Live", fireflies: "Live", highlight: true },
    { label: "Competitive-intel alerts", us: "Real-time Slack ping", otter: "—", fireflies: "—", highlight: true },
    { label: "CRM export (HubSpot + SF)", us: "One click on Pro", otter: "Enterprise only", fireflies: "Included all plans" },
    { label: "Microsoft Teams", us: "Yes (Business+)", otter: "Yes", fireflies: "Yes" },
    { label: "SSO / SAML", us: "Enterprise", otter: "Enterprise", fireflies: "Enterprise" },
    { label: "API access", us: "Business+", otter: "Enterprise", fireflies: "Business+" },
    { label: "Data used to train models", us: "Never", otter: "Opt-in only", fireflies: "Opt-in only", highlight: true },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center mb-12">
          <div className="eyebrow inline-flex items-center gap-2 mb-4">
            <BarChart3 size={12} /> How we stack up
          </div>
          <h2 className="text-[clamp(1.5rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
            CallNote Pro vs Otter.ai vs Fireflies.ai
          </h2>
          <p className="text-gray-500 text-[14px] max-w-xl mx-auto">
            Public pricing and feature data, side by side. Updated
            monthly. Spotted something stale?{" "}
            <a href="mailto:hello@callnotepro.com" className="underline underline-offset-2 hover:text-gray-900">
              Tell us
            </a>
            .
          </p>
        </div>

        <div className="doppel-outer overflow-hidden">
          <div className="doppel-inner overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-4 pl-6 pr-3 text-[11px] uppercase tracking-[0.12em] text-gray-500 font-medium">
                    Capability
                  </th>
                  <th className="py-4 px-3 text-[12px] uppercase tracking-[0.12em] text-[#F26522] font-semibold">
                    CallNote Pro
                  </th>
                  <th className="py-4 px-3 text-[11px] uppercase tracking-[0.12em] text-gray-500 font-medium">
                    Otter.ai
                  </th>
                  <th className="py-4 pr-6 pl-3 text-[11px] uppercase tracking-[0.12em] text-gray-500 font-medium">
                    Fireflies.ai
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-100 last:border-b-0 ${r.highlight ? "bg-[#F26522]/[0.04]" : ""}`}
                  >
                    <td className="py-3.5 pl-6 pr-3 text-[13px] text-gray-700">
                      {r.label}
                    </td>
                    <td className="py-3.5 px-3 text-[13px] text-gray-900 font-medium">
                      {r.us}
                    </td>
                    <td className="py-3.5 px-3 text-[13px] text-gray-500">
                      {r.otter}
                    </td>
                    <td className="py-3.5 pr-6 pl-3 text-[13px] text-gray-500">
                      {r.fireflies}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-4 max-w-2xl mx-auto text-center">
          Competitor data is from public pricing pages and product pages
          as of 2026-06-22. We try to keep this honest — if you spot
          something we got wrong, we&apos;ll fix it in the next update.
        </p>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;
    const stepEls = sectionRef.current.querySelectorAll(".workflow-step");
    const line = sectionRef.current.querySelector(".workflow-line");
    const dots = sectionRef.current.querySelectorAll(".workflow-dot");

    gsap.fromTo(stepEls, { opacity: 0, x: -30 }, {
      opacity: 1, x: 0, stagger: 0.2, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
    });

    if (line) {
      gsap.fromTo(line, { scaleY: 0 }, {
        scaleY: 1, duration: 1.4, ease: "power2.inOut",
        scrollTrigger: { trigger: sectionRef.current, start: "top 60%", end: "bottom 40%", scrub: 1.2 },
      });
    }

    gsap.fromTo(dots, { scale: 0, opacity: 0 }, {
      scale: 1, opacity: 1, stagger: 0.3, duration: 0.6, ease: "back.out(2)",
      scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.04) 0%, transparent 60%)" }} />
      <div className="max-w-[1440px] mx-auto relative">
        <div className="text-center mb-14">
          <div className="eyebrow inline-flex items-center gap-2 mb-5">
            <Zap size={12} /> How it works
          </div>
          <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em]">
            Four steps to <span className="text-gray-400">zero notes</span>
          </h2>
          <p className="text-[14px] text-gray-500 mt-3 max-w-md mx-auto">
            From raw recording to CRM-ready insights in under 60 seconds
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px workflow-line origin-top"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(242,101,34,0.25), rgba(37,99,235,0.15), transparent)" }} />

          <div className="space-y-10 md:space-y-16">
            {steps.map((s, i) => (
              <div key={i} className={`workflow-step relative flex items-center gap-6 md:gap-12 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
                style={{ opacity: 0, transform: "translateX(-30px)" }}>
                <div className={`flex-1 ${i % 2 === 1 ? "md:text-right" : ""}`}>
                  <div className="doppel-outer inline-block w-full group">
                    <div className="doppel-inner p-5 sm:p-6 md:p-8 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        style={{ background: `radial-gradient(ellipse at 50% 50%, ${s.color}08, transparent 70%)` }} />
                      <div className="relative">
                        <div className={`flex items-center gap-3 mb-3 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
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
                </div>

                <div className="workflow-dot absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-10 flex items-center justify-center"
                  style={{ background: s.color, boxShadow: `0 0 24px ${s.color}50` }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

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
  const { isSignedIn } = useUser();
  const heroRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!heroRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(heroRef.current.querySelector(".hero-eyebrow"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.2)
      .fromTo(heroRef.current.querySelector(".hero-title"), { y: 40, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 1.1 }, 0.3)
      .fromTo(heroRef.current.querySelector(".hero-subtitle"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.5)
      .fromTo(heroRef.current.querySelector(".hero-badge"), { y: 16, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.6 }, 0.7);
  }, { scope: heroRef });

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-hidden selection:bg-[#F26522]/20">
      <Nav />

      <section ref={heroRef} className="relative min-h-[90dvh] flex flex-col items-center justify-center px-5 sm:px-8 lg:px-12 pt-32 pb-24 sm:pb-32 bg-[#EFEFEF] overflow-hidden">
        <ParticleCanvas />
        <div className="radial-glow top-[-10%] left-[10%]" style={{ background: "#F26522" }} />
        <div className="radial-glow bottom-[-10%] right-[5%]" style={{ background: "#2563eb" }} />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="hero-eyebrow eyebrow inline-flex items-center gap-2 mb-8">
            <Sparkles size={12} /> Everything you need
          </div>
          <h1 className="hero-title text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-5">
            Features built for<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-600 to-gray-400">
              the modern SDR
            </span>
          </h1>
          <p className="hero-subtitle text-[14px] sm:text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
            From transcription to CRM export, CallNote Pro handles the entire sales call workflow.
            No bots. No complex setup. Just results.
          </p>
          <div className="hero-badge inline-flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-[12px] text-gray-500 shadow-sm">
            <span className="flex items-center gap-1.5">
              <Cpu size={14} className="text-[#F26522]" />
              <span>12 features</span>
            </span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1.5">
              <Lock size={14} className="text-[#2563eb]" />
              <span>SOC 2 compliant</span>
            </span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-[#059669]" />
              <span>Under 60s processing</span>
            </span>
          </div>
          <HeroMockup />
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-float">
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(242,101,34,0.04) 0%, transparent 60%)" }} />
        <div className="max-w-[1440px] mx-auto relative">
          {featureCategories.map((cat, ci) => (
            <div key={ci} id={cat.id} className="mb-12 sm:mb-16 last:mb-0 scroll-mt-24">
              <div className="text-center mb-8 reveal-card" style={{ opacity: 0, transform: "translateY(30px)" }}>
                <div className="inline-flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-gray-200" />
                  <span className="text-[11px] font-mono font-medium tracking-[0.2em] uppercase text-gray-400">
                    Section {String(ci + 1).padStart(2, "0")}
                  </span>
                  <div className="h-px w-8 bg-gray-200" />
                </div>
                <h2 className="text-[clamp(1.25rem,3vw,2rem)] font-medium tracking-tight text-gray-900 mb-1.5">
                  {cat.name}
                </h2>
                <p className="text-[13px] text-gray-500">{cat.desc}</p>
              </div>

              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {features.slice(cat.start, cat.end).map((f, i) => (
                    <FeatureCard key={cat.start + i} feature={f} index={cat.start + i} />
                  ))}
                </div>
              </div>

              {ci < featureCategories.length - 1 && (
                <div className="mt-12 sm:mt-16 flex items-center justify-center gap-4">
                  <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  <div className="w-2 h-2 rounded-full bg-gray-200" />
                  <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="relative pb-8">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="relative">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(242,101,34,0.02) 50%, transparent 100%)" }} />
            <StatsSection />
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      <WorkflowSection />

      <ComparisonSection />

      <section className="pb-16 sm:pb-20 lg:pb-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="doppel-outer group">
            <div className="doppel-inner p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(242,101,34,0.06), transparent 70%)" }} />
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#F26522]/20 to-transparent" />
              <div className="relative z-10">
                <div className="eyebrow inline-flex items-center gap-2 mb-5">
                  <Zap size={12} /> Start today
                </div>
                <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3">
                  Ready to save hours every week?
                </h2>
                <p className="text-gray-500 mb-8 text-[14px]">Join SDRs who cut their note-taking time by 80%.</p>
                {isSignedIn ? (
                  <Link href="/app"
                    className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300">
                    <span className="flex flex-col overflow-hidden h-[20px]">
                      <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                        Open Dashboard
                      </span>
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
      </section>
    </main>
  );
}
