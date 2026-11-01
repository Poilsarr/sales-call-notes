"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CSSProperties, ElementType, RefObject } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Mic, Brain, Target, Share2, BarChart3,
  Upload, Layers, Shield, Globe, Download, Search,
  Users, ArrowRight, Check,
} from "lucide-react";
import { useAmbientLive } from "@/components/use-ambient-live";
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
  { icon: Shield, title: "Privacy controls", desc: "Your calls are processed by disclosed cloud providers, never used to train our models, and covered by export and deletion controls.", color: "#059669", size: "md", direction: "a" as const },
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

/**
 * Per-card link targets — one honest destination per feature card.
 * Rendered beside the Learn-more toggle (toggle behavior untouched).
 * All hrefs are existing routes: /pricing, /api-docs/v1, /privacy,
 * /vs/otter-ai, /vs/fireflies, /vs/gong.
 */
const cardLinks: { href: string; label: string }[] = [
  { href: "/pricing", label: "See pricing" },
  { href: "/vs/otter-ai", label: "Read comparison" },
  { href: "/vs/fireflies", label: "Read comparison" },
  { href: "/api-docs/v1", label: "API docs" },
  { href: "/vs/gong", label: "Read comparison" },
  { href: "/vs/gong", label: "Read comparison" },
  { href: "/api-docs/v1", label: "API docs" },
  { href: "/api-docs/v1", label: "API docs" },
  { href: "/privacy", label: "Privacy details" },
  { href: "/vs/otter-ai", label: "Read comparison" },
  { href: "/api-docs/v1", label: "API docs" },
  { href: "/pricing", label: "See pricing" },
];

const featureCategories = [
  { start: 0, end: 4, name: "Core Platform", id: "core-platform", desc: "The essential pipeline from raw audio to structured insights" },
  { start: 4, end: 8, name: "Analytics & Intelligence", id: "analytics-intelligence", desc: "Deep understanding of every customer conversation" },
  { start: 8, end: 12, name: "Enterprise & Security", id: "enterprise-security", desc: "Scale with confidence across your entire organization" },
];

function HeroTimeline({ heroRef }: { heroRef: RefObject<HTMLDivElement | null> }) {
  useGSAP(() => {
    if (!heroRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(heroRef.current.querySelector(".hero-eyebrow"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.2)
      .fromTo(heroRef.current.querySelector(".hero-title"), { y: 40, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 1.1 }, 0.3)
      .fromTo(heroRef.current.querySelector(".hero-subtitle"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.5)
      .fromTo(heroRef.current.querySelector(".hero-badge"), { y: 16, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.6 }, 0.7);
  }, { scope: heroRef });

  return null;
}

function HeroMockup() {
  const mockupRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!mockupRef.current) return;
    // Visible by default (no opacity-0) to avoid missing-hero flash when
    // chunk loads late on 3G; gsap.from animates from hidden to visible.
    gsap.from(mockupRef.current, {
      y: 60,
      opacity: 0,
      scale: 0.95,
      duration: 1.2,
      delay: 1,
      ease: "power3.out",
    });
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
    <div ref={mockupRef} className="w-full max-w-lg mx-auto mt-10 md:mt-14">
      <div className="doppel-outer">
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

export function HeroAnimations({ heroRef }: { heroRef: RefObject<HTMLDivElement | null> }) {
  return (
    <>
      <HeroTimeline heroRef={heroRef} />
      <HeroMockup />
    </>
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
        className="group relative h-full cursor-default rounded-2xl overflow-hidden doppel-outer"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={glowRef} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl" />
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
            <span className="flex items-center gap-3">
              <Link
                href={cardLinks[index]?.href ?? "/api-docs/v1"}
                className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#F26522] hover:underline"
              >
                {cardLinks[index]?.label ?? "API docs"} →
              </Link>
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
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* fws scenes — ported from studio-artboards/fa-steps-v1 (Batch A). */

type SceneKey = "upload" | "transcribe" | "analyze" | "export";

function FwsSceneUpload() {
  return (
    <>
      <span className="fws-scenecap">Upload tray</span>
      <div className="fws-scenebody">
        <div className="fws-drop">
          <div className="fws-filechip">
            <span className="fws-fw" aria-hidden="true">
              <i style={{ "--h": "6px" } as CSSProperties} />
              <i style={{ "--h": "12px" } as CSSProperties} />
              <i style={{ "--h": "9px" } as CSSProperties} />
              <i style={{ "--h": "14px" } as CSSProperties} />
              <i style={{ "--h": "7px" } as CSSProperties} />
            </span>
            <span className="fws-fname">acme_discovery.mp3</span>
            <span className="fws-ftag">Queued</span>
          </div>
          <div className="fws-filechip">
            <span className="fws-fw" aria-hidden="true">
              <i style={{ "--h": "10px" } as CSSProperties} />
              <i style={{ "--h": "5px" } as CSSProperties} />
              <i style={{ "--h": "13px" } as CSSProperties} />
              <i style={{ "--h": "8px" } as CSSProperties} />
              <i style={{ "--h": "11px" } as CSSProperties} />
            </span>
            <span className="fws-fname">stark_closing.wav</span>
            <span className="fws-ftag">Queued</span>
          </div>
          <div className="fws-filechip">
            <span className="fws-fw" aria-hidden="true">
              <i style={{ "--h": "7px" } as CSSProperties} />
              <i style={{ "--h": "12px" } as CSSProperties} />
              <i style={{ "--h": "6px" } as CSSProperties} />
              <i style={{ "--h": "10px" } as CSSProperties} />
              <i style={{ "--h": "9px" } as CSSProperties} />
            </span>
            <span className="fws-fname">vandelay_demo.m4a</span>
            <span className="fws-ftag">T-2s</span>
          </div>
          <div className="fws-progress" aria-hidden="true">
            <div className="fws-progressfill" />
          </div>
        </div>
      </div>
    </>
  );
}

function FwsSceneTranscribe() {
  return (
    <>
      <span className="fws-scenecap">Speech → text</span>
      <div className="fws-beam" aria-hidden="true" />
      <div className="fws-scenebody">
        <div className="fws-trwrap">
          <div className="fws-eq" aria-hidden="true">
            <i style={{ "--h": "40%", "--d": "0s" } as CSSProperties} />
            <i style={{ "--h": "76%", "--d": "0.08s" } as CSSProperties} className="fws-hot" />
            <i style={{ "--h": "55%", "--d": "0.16s" } as CSSProperties} />
            <i style={{ "--h": "100%", "--d": "0.24s" } as CSSProperties} className="fws-hot" />
            <i style={{ "--h": "48%", "--d": "0.32s" } as CSSProperties} />
            <i style={{ "--h": "88%", "--d": "0.4s" } as CSSProperties} className="fws-hot" />
            <i style={{ "--h": "35%", "--d": "0.48s" } as CSSProperties} />
            <i style={{ "--h": "70%", "--d": "0.56s" } as CSSProperties} />
            <i style={{ "--h": "58%", "--d": "0.64s" } as CSSProperties} className="fws-hot" />
          </div>
          <div className="fws-trline">
            <span className="fws-spk fws-spk--a" aria-hidden="true" />
            <span className="fws-trbar" style={{ width: "64%" }} />
          </div>
          <div className="fws-trline">
            <span className="fws-spk fws-spk--b" aria-hidden="true" />
            <span className="fws-trbar" style={{ width: "46%" }} />
          </div>
          <div className="fws-trline">
            <span className="fws-spk fws-spk--a" aria-hidden="true" />
            <span className="fws-trbar" style={{ width: "56%" }} />
          </div>
        </div>
      </div>
    </>
  );
}

function FwsSceneAnalyze() {
  return (
    <>
      <span className="fws-scenecap">Signals extracted</span>
      <div className="fws-scenebody">
        <div className="fws-doc" aria-hidden="true">
          <div className="fws-docbar" />
          <div className="fws-docbar fws-docbar--w" />
          <div className="fws-docbar" style={{ width: "78%" }} />
          <div className="fws-docbar fws-docbar--w" style={{ width: "52%" }} />
        </div>
        <div className="fws-eject">
          <span className="fws-echip"><b aria-hidden="true" />OWNER · MAYA KIM</span>
          <span className="fws-echip fws-echip--g"><b aria-hidden="true" />DUE · OCT 14</span>
          <span className="fws-echip"><b aria-hidden="true" />RIVAL · GONG</span>
        </div>
      </div>
    </>
  );
}

function FwsSceneExport() {
  return (
    <>
      <span className="fws-scenecap">CRM write-back</span>
      <div className="fws-scenebody" style={{ flexDirection: "column", gap: 0 }}>
        <div className="fws-exrow">
          <div className="fws-node">
            <span className="fws-nball fws-nball--hs" aria-hidden="true" />
            <span className="fws-nname">HUBSPOT</span>
          </div>
          <span className="fws-flowline" aria-hidden="true" />
          <div className="fws-node">
            <span className="fws-nball fws-nball--sf" aria-hidden="true" />
            <span className="fws-nname">SALESFORCE</span>
          </div>
          <span className="fws-flowline" aria-hidden="true" />
          <div className="fws-node">
            <span className="fws-nball fws-nball--chk" aria-hidden="true">
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="#34d399" strokeWidth={2.6}>
                <path d="M4 12.5 9.5 18 20 6.5" />
              </svg>
            </span>
          </div>
        </div>
        <div className="fws-sumrow">
          <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="#6ee7b7" strokeWidth={2} aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          <span className="fws-nname">SUMMARY · OWNERS · DUE DATES</span>
        </div>
      </div>
    </>
  );
}

const workflowSteps: {
  num: string;
  title: string;
  desc: string;
  scene: SceneKey;
  spine: string;
  chips: { hot?: boolean; grn?: boolean; label: string }[];
}[] = [
  {
    num: "STEP 01",
    title: "Upload",
    desc: "Drop your call recording. MP3, WAV, M4A, WebM — bulk-safe.",
    scene: "upload",
    spine: "Ingest",
    chips: [
      { hot: true, label: "NO TOKEN BURN" },
      { label: "DROP OR CLICK" },
    ],
  },
  {
    num: "STEP 02",
    title: "Transcribe",
    desc: "Whisper AI converts speech to text — speakers labeled automatically.",
    scene: "transcribe",
    spine: "Decode",
    chips: [
      { hot: true, label: "WHISPER-LARGE-V3" },
      { grn: true, label: "VIA GROQ" },
    ],
  },
  {
    num: "STEP 03",
    title: "Analyze",
    desc: "Extract insights & action items — owners, dates, rivals named.",
    scene: "analyze",
    spine: "Read",
    chips: [
      { hot: true, label: "ACTIONS · OWNERS" },
      { label: "RIVAL CATCH" },
    ],
  },
  {
    num: "STEP 04",
    title: "Export",
    desc: "Push to CRM or download — summary, owners, dates included.",
    scene: "export",
    spine: "Deploy",
    chips: [
      { hot: true, label: "HUBSPOT · SALESFORCE" },
      { grn: true, label: "SYNCED 12S AGO" },
    ],
  },
];

const SCENES: Record<SceneKey, ElementType> = {
  upload: FwsSceneUpload,
  transcribe: FwsSceneTranscribe,
  analyze: FwsSceneAnalyze,
  export: FwsSceneExport,
};

/* fst cells — ported from studio-artboards/fa-stats-v1 (Batch A).
   One console ribbon: giant mono values + instrument meters. */

const BARS_60S = [
  { h: "10px", off: true }, { h: "14px", off: true }, { h: "9px", off: true },
  { h: "16px", off: true }, { h: "12px" }, { h: "20px" }, { h: "16px" },
  { h: "26px" }, { h: "14px", off: true }, { h: "10px", off: true },
];

const BARS_ENGINE = [
  { h: "14px", off: true }, { h: "20px" }, { h: "26px" },
  { h: "18px", off: true }, { h: "12px", off: true },
];

function StatsSection() {
  const sectionRef = useAmbientLive<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      data-live="false"
      className="fst-sec relative py-14 sm:py-16 lg:py-20 px-5 sm:px-8 lg:px-12"
    >
      <div className="fst-grain" aria-hidden="true" />
      <div className="fst-sweep" aria-hidden="true" />
      <div className="max-w-[1300px] mx-auto relative">
        <h2 className="sr-only">Gauge pipeline telemetry</h2>
        <div className="fst-meta">
          <span className="fst-metalabel">
            <b>System telemetry</b> · Gauge pipeline
          </span>
          <span className="fst-live"><b aria-hidden="true" />Live</span>
        </div>

        <div className="fst-rail">
          {/* 60s — avg processing */}
          <div className="fst-cell">
            <span className="fst-hero fst-hero--o" aria-hidden="true" />
            <span className="fst-label">
              <i aria-hidden="true" style={{ background: "#fb923c" }} />
              Avg processing time
            </span>
            <div className="fst-big">60<u>s</u></div>
            <div className="fst-sub">Call in → Notes out</div>
            <div className="fst-instrument" aria-hidden="true">
              {BARS_60S.map((b, i) => (
                <i
                  key={i}
                  className={b.off ? "fst-off" : undefined}
                  style={{ "--h": b.h } as CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* engine — whisper via groq */}
          <div className="fst-cell">
            <span className="fst-hero fst-hero--i" aria-hidden="true" />
            <span className="fst-label">
              <i aria-hidden="true" style={{ background: "#a5b4fc" }} />
              Transcription engine
            </span>
            <span className="fst-role fst-role--o">Via Groq</span>
            <div className="fst-engine">whisper-large-v3</div>
            <div className="fst-sub">Speaker diarization · 30+ languages</div>
            <div className="fst-instrument" aria-hidden="true">
              {BARS_ENGINE.map((b, i) => (
                <i
                  key={i}
                  className={b.off ? "fst-off" : undefined}
                  style={{ "--h": b.h } as CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* languages */}
          <div className="fst-cell">
            <span className="fst-hero fst-hero--g" aria-hidden="true" />
            <span className="fst-label">
              <i aria-hidden="true" style={{ background: "#6ee7b7" }} />
              Languages supported
            </span>
            <div className="fst-big">12<u>+</u></div>
            <div className="fst-sub">Auto-detect · Native output</div>
            <div className="fst-ticks" aria-hidden="true">
              <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
            </div>
            <div className="mt-auto" aria-hidden="true">
              <svg className="block" width="70" height="26" viewBox="0 0 70 26" fill="none">
                <path d="M4 22a31 31 0 0 1 62 0" stroke="rgba(52,211,153,.55)" strokeWidth="1.5" />
                <path d="M11 22a24 24 0 0 1 48 0" stroke="rgba(52,211,153,.3)" strokeWidth="1.5" />
                <circle cx="35" cy="7" r="2.2" fill="#34d399" />
                <circle cx="14" cy="17" r="2" fill="rgba(52,211,153,.55)" />
                <circle cx="56" cy="17" r="2" fill="rgba(52,211,153,.55)" />
              </svg>
            </div>
          </div>

          {/* CRM integrations */}
          <div className="fst-cell">
            <span className="fst-hero fst-hero--o" aria-hidden="true" />
            <span className="fst-label">
              <i aria-hidden="true" style={{ background: "#fb923c" }} />
              CRM integrations
            </span>
            <div className="fst-big">10<u>+</u></div>
            <div className="fst-sub">HubSpot · Salesforce · Slack</div>
            <div className="fst-chain" aria-hidden="true">
              <i className="fst-on" /><s />
              <i className="fst-on" /><s />
              <i className="fst-on" /><s />
              <i /><s />
              <i /><s />
              <i />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const sectionRef = useAmbientLive<HTMLElement>();

  useGSAP(() => {
    const sec = sectionRef.current;
    if (!sec) return;
    // Reveal rows once on scroll; ambient loops inside scenes are CSS-driven
    // and pause via [data-live] when off-screen. Skipped for reduced motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = sec.querySelectorAll(".fws-row");
    gsap.fromTo(rows, { opacity: 0, y: 36 }, {
      opacity: 1, y: 0, stagger: 0.18, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: sec, start: "top 72%" },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      data-live="false"
      className="fws-sec py-16 sm:py-20 lg:py-28 px-5 sm:px-8 lg:px-12"
    >
      <div className="fws-grain" aria-hidden="true" />
      <div className="max-w-[1300px] mx-auto relative">
        <header className="text-center mb-14">
          <p className="fpb-eyebrow mb-4">How it works</p>
          <h2 className="text-[clamp(1.6rem,4vw,3.1rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white">
            Four steps to <span className="text-[#7d818c]">zero notes</span>
          </h2>
          <p className="fws-sub mt-4">Raw recording → CRM-ready · Under 60 seconds</p>
        </header>

        <div className="fws-flow">
          {workflowSteps.map((s, i) => {
            const Scene = SCENES[s.scene];
            return (
              <div key={s.num} className={`fws-row${i % 2 === 1 ? " fws-row--rev" : ""}`}>
                <article className="fws-sidecard">
                  <p className="fws-num"><b>{s.num}</b></p>
                  <h3 className="fws-title">{s.title}</h3>
                  <p className="fws-desc">{s.desc}</p>
                  <div className="fws-micro">
                    {s.chips.map((c) => (
                      <span
                        key={c.label}
                        className={`fws-mchip${c.hot ? " fws-mchip--hot" : ""}${c.grn ? " fws-mchip--grn" : ""}`}
                      >
                        {c.label}
                      </span>
                    ))}
                  </div>
                </article>

                <div className="fws-spine" aria-hidden="true">
                  <span className="fws-spineline" />
                  <span className="fws-spinechip">{s.spine}</span>
                  <span className="fws-spineline" />
                </div>

                <div
                  className="fws-scene"
                  role="img"
                  aria-label={`${s.title} — ${s.desc}`}
                >
                  <Scene />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function FeaturesAnimations() {
  return (
    <>
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

      <StatsSection />

      <WorkflowSection />
    </>
  );
}