"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Nav from "@/components/nav";
import { ArrowRight, Sparkles, Figma, Globe, Code, ShoppingCart, MessageSquare, BarChart3, Database, Zap, Layout, PenTool, Monitor } from "lucide-react";

const tools = [
  { icon: Figma, name: "Figma", desc: "Industry-standard design tool for UI/UX, prototyping, and design systems collaboration.", status: "Expert", color: "#a855f7" },
  { icon: Globe, name: "Webflow", desc: "Visual web development platform for building responsive, CMS-powered websites without code.", status: "Expert", color: "#2563eb" },
  { icon: Code, name: "Next.js", desc: "React framework for production-grade web applications with SSR, SSG, and optimal performance.", status: "Preferred", color: "#111111" },
  { icon: ShoppingCart, name: "Shopify", desc: "Leading e-commerce platform — we design and build custom storefronts for maximum conversion.", status: "Expert", color: "#059669" },
  { icon: PenTool, name: "Framer", desc: "Design-to-code platform for interactive prototypes and production-ready landing pages.", status: "Expert", color: "#2563eb" },
  { icon: MessageSquare, name: "Slack", desc: "Real-time client communication, project updates, and feedback loops built into our workflow.", status: "Tool", color: "#7c3aed" },
  { icon: BarChart3, name: "Hotjar", desc: "Heat mapping, session recording, and user feedback tools for data-informed design decisions.", status: "Tool", color: "#ea580c" },
  { icon: Database, name: "Sanity", desc: "Headless CMS for structured content management with real-time collaboration features.", status: "Preferred", color: "#dc2626" },
  { icon: Layout, name: "Tailwind CSS", desc: "Utility-first CSS framework for rapid, consistent, and responsive interface development.", status: "Preferred", color: "#0891b2" },
  { icon: Zap, name: "Vercel", desc: "Deployment platform with edge functions, analytics, and instant rollbacks for web projects.", status: "Tool", color: "#111111" },
  { icon: Monitor, name: "After Effects", desc: "Motion graphics and visual effects for brand films, product demos, and animated content.", status: "Expert", color: "#6366f1" },
  { icon: Layout, name: "Framer Motion", desc: "Production-ready animation library for React — micro-interactions, page transitions, and gestures.", status: "Preferred", color: "#ca8a04" },
];

export default function IntegrationsPage() {
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
      }, { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />

      <section className="pt-36 sm:pt-40 pb-20 sm:pb-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6 sm:mb-8 reveal"
              style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.1s", transform: "translateY(16px)", opacity: 0, filter: "blur(4px)" }}>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] sm:text-[12px] font-semibold">4</div>
              <span className="text-[12px] sm:text-[13px] font-medium border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">Our toolkit</span>
            </div>
            <h1 className="font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 mb-6 reveal"
              style={{ fontSize: "clamp(2rem,5vw,4.2rem)", transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.2s", transform: "translateY(24px)", opacity: 0, filter: "blur(6px)" }}>
              Tools we use to<br />bring ideas to life.
            </h1>
            <p className="text-[16px] sm:text-[17px] leading-[1.6] text-gray-500 max-w-xl reveal"
              style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.3s", transform: "translateY(16px)", opacity: 0 }}>
              We select the best tools for every project — from design to deployment, we use technology that delivers.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24 sm:pb-32 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {tools.map((tool, i) => (
            <div key={tool.name} className="reveal"
              style={{ transition: `all 0.8s cubic-bezier(0.25,1,0.5,1) ${0.05 + i * 0.05}s`, transform: "translateY(24px)", opacity: 0, filter: "blur(4px)" }}>
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-500 h-full flex flex-col group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${tool.color}10` }}>
                    <tool.icon strokeWidth={1.5} className="w-5 h-5" style={{ color: tool.color }} />
                  </div>
                  <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                    tool.status === "Expert" ? "bg-[#F26522]/10 text-[#F26522]" :
                    tool.status === "Preferred" ? "bg-blue-50 text-blue-600" :
                    "bg-gray-100 text-gray-500"
                  }`}>{tool.status}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-2">{tool.name}</h3>
                <p className="text-[13px] leading-[1.5] text-gray-500 flex-1">{tool.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#F5F5F5] py-20 sm:py-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-medium leading-[1.12] tracking-[-0.02em] text-gray-900 mb-4"
              style={{ fontSize: "clamp(1.5rem,4vw,2.8rem)" }}>
              Have a tool we should add?
            </h2>
            <p className="text-[15px] leading-[1.6] text-gray-500 mb-8 max-w-lg mx-auto">
              We&apos;re always exploring new tools. If your stack uses something we haven&apos;t listed, let&apos;s talk.
            </p>
            <Link href="/" className="group bg-[#F26522] hover:bg-[#e05a1a] text-white rounded-full pl-5 pr-2 py-2 inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-300">
              <span className="flex flex-col overflow-hidden h-[20px]">
                <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">Start a project</span>
                <span className="leading-[20px]">Start a project</span>
              </span>
              <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                <ArrowRight size={14} className="text-[#F26522]" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
