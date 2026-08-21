"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Nav from "@/components/nav";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Sparkles, ArrowRight, Zap, Cpu, Lock, BarChart3 } from "lucide-react";
import StickyMarketingCta from "@/components/sticky-marketing-cta";

// Single async boundary for all GSAP/ScrollTrigger animations — avoids duplicate gsap
// runtime and second waterfall for the same module (previous code had two
// `dynamic(() => import("./features-animations"))` boundaries).
const FeaturesBundle = dynamic(
  () =>
    import("./features-animations").then((mod) => ({
      default: (props: {
        heroRef?: RefObject<HTMLDivElement | null>;
        variant?: "hero" | "features";
      }) => {
        if (props.variant === "hero") return <mod.HeroAnimations heroRef={props.heroRef!} />;
        return <mod.default />;
      },
    })),
  { ssr: false }
);

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
            Gauge vs Otter.ai vs Fireflies.ai
          </h2>
          <p className="text-gray-500 text-[14px] max-w-xl mx-auto">
            Public pricing and feature data, side by side. Updated
            monthly. Spotted something stale?{" "}
            <a href="mailto:hello@usegauge.com" className="underline underline-offset-2 hover:text-gray-900">
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
                  <th className="py-4 px-3 text-[12px] uppercase tracking-[0.12em] text-[#C94F17] font-semibold">
                    Gauge
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

export default function FeaturesPageClient() {
  const { isSignedIn } = useUser();
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Nav />
      <main id="main" className="min-h-screen bg-white text-gray-900 overflow-hidden selection:bg-[#F26522]/20">

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
            From transcription to CRM export, Gauge handles the entire sales call workflow.
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
              <span>SOC 2 roadmap</span>
            </span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-[#059669]" />
              <span>Under 60s processing</span>
            </span>
          </div>
          <FeaturesBundle variant="hero" heroRef={heroRef} />
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-float">
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      <FeaturesBundle variant="features" />

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
                    className="group inline-flex items-center gap-2 bg-[#C94F17] hover:bg-[#A84310] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300">
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
                    <button className="group inline-flex items-center gap-2 bg-[#C94F17] hover:bg-[#A84310] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300 cursor-pointer">
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

      <StickyMarketingCta label="Start with 300 free minutes/mo" href="/sign-up" cta="Start free" />
    </main>
    </>
  );
}
