"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Nav from "@/components/nav";
import { ArrowRight, Palette, Monitor, Globe, Camera, Type, Layout, Sparkles, Layers, MessageSquare, BarChart3, Target } from "lucide-react";

const services = [
  { icon: Palette, title: "Brand Identity", desc: "Logo systems, color palettes, typography, and visual language that makes your brand unmistakable.", color: "#F26522" },
  { icon: Monitor, title: "Web Design", desc: "High-conversion landing pages, marketing sites, and web applications with obsessive attention to detail.", color: "#2563eb" },
  { icon: Globe, title: "E-Commerce", desc: "Shopify, WooCommerce, and custom storefronts designed to maximize conversion and average order value.", color: "#059669" },
  { icon: Camera, title: "Visual Content", desc: "Product photography, brand film, motion graphics, and visual assets that tell your story.", color: "#d946ef" },
  { icon: Type, title: "Typography Systems", desc: "Custom typefaces, font pairing, and lettering that give your brand a distinct voice.", color: "#ea580c" },
  { icon: Layout, title: "UI/UX Design", desc: "User research, wireframing, prototyping, and interaction design for digital products.", color: "#0891b2" },
  { icon: Layers, title: "Design Systems", desc: "Scalable component libraries and design tokens that keep your product consistent across every surface.", color: "#7c3aed" },
  { icon: MessageSquare, title: "Content Strategy", desc: "Messaging frameworks, copywriting, and content architecture that converts visitors into customers.", color: "#dc2626" },
  { icon: BarChart3, title: "Conversion Optimization", desc: "A/B testing, heat mapping, and data-driven design improvements backed by real metrics.", color: "#ca8a04" },
  { icon: Target, title: "SEO & Performance", desc: "Technical SEO, Core Web Vitals optimization, and Lighthouse score improvements for organic growth.", color: "#16a34a" },
];

function ServiceCard({ service, index }: { service: typeof services[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="opacity-0 translate-y-8 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] [&.is-visible]:opacity-100 [&.is-visible]:translate-y-0 group"
      style={{ transitionDelay: `${index * 0.06}s` }}
    >
      <div className="bg-white rounded-2xl p-7 sm:p-8 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-500 h-full flex flex-col">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${service.color}10` }}>
          <service.icon strokeWidth={1.5} className="w-5 h-5" style={{ color: service.color }} />
        </div>
        <h3 className="text-[16px] font-semibold text-gray-900 mb-2">{service.title}</h3>
        <p className="text-[14px] leading-[1.6] text-gray-500 flex-1">{service.desc}</p>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const els = heroRef.current.querySelectorAll(".hero-reveal");
    els.forEach((el, i) => {
      setTimeout(() => {
        (el as HTMLElement).style.opacity = "1";
        (el as HTMLElement).style.transform = "translateY(0)";
      }, 100 + i * 120);
    });
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />

      <section ref={heroRef} className="pt-36 sm:pt-40 pb-20 sm:pb-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl">
            <div className="hero-reveal flex items-center gap-3 mb-6 sm:mb-8" style={{ opacity: 0, transform: "translateY(20px)", transition: "all 0.8s cubic-bezier(0.25,1,0.5,1)" }}>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] sm:text-[12px] font-semibold">1</div>
              <span className="text-[12px] sm:text-[13px] font-medium border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">Our services</span>
            </div>
            <h1 className="hero-reveal font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 mb-6"
              style={{ fontSize: "clamp(2rem,5vw,4.2rem)", opacity: 0, transform: "translateY(24px)", transition: "all 0.8s cubic-bezier(0.25,1,0.5,1)" }}>
              Full-service design<br />for ambitious brands.
            </h1>
            <p className="hero-reveal text-[16px] sm:text-[17px] leading-[1.6] text-gray-500 max-w-2xl"
              style={{ opacity: 0, transform: "translateY(16px)", transition: "all 0.8s cubic-bezier(0.25,1,0.5,1)" }}>
              Strategy, design, and development — we take your brand from concept to launch with 
              obsessive attention to every pixel.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24 sm:pb-32 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {services.map((s, i) => (
              <ServiceCard key={i} service={s} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F5F5] py-20 sm:py-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl mb-14 sm:mb-16">
            <h2 className="font-medium leading-[1.12] tracking-[-0.02em] text-gray-900 mb-6"
              style={{ fontSize: "clamp(1.5rem,4vw,2.8rem)" }}>
              How we work
            </h2>
            <p className="text-[15px] leading-[1.6] text-gray-500">
              Every project follows our proven 4-phase process. We move fast without cutting corners.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 sm:gap-6">
            {[
              { num: "01", title: "Discovery", desc: "We dive deep into your market, competitors, and customers to surface the strategic foundation.", color: "#F26522" },
              { num: "02", title: "Design", desc: "Concepts, iterations, and refinements until every pixel serves the strategy.", color: "#2563eb" },
              { num: "03", title: "Build", desc: "Development with clean code, performance optimization, and rigorous QA.", color: "#059669" },
              { num: "04", title: "Launch", desc: "Deployment, monitoring, and ongoing optimization to ensure your investment pays off.", color: "#7c3aed" },
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 sm:p-8 border border-gray-100">
                <span className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-gray-200 leading-none block mb-4">{step.num}</span>
                <h3 className="text-[16px] font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-[14px] leading-[1.6] text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl text-center mx-auto">
            <h2 className="font-medium leading-[1.12] tracking-[-0.02em] text-gray-900 mb-4"
              style={{ fontSize: "clamp(1.5rem,4vw,2.8rem)" }}>
              Ready to start your project?
            </h2>
            <p className="text-[15px] leading-[1.6] text-gray-500 mb-8">
              We take on a limited number of projects each quarter. Book a free strategy call.
            </p>
            <Link href="/" className="group bg-[#F26522] hover:bg-[#e05a1a] text-white rounded-full pl-5 pr-2 py-2 inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-300">
              <span className="flex flex-col overflow-hidden h-[20px]">
                <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">Book a strategy call</span>
                <span className="leading-[20px]">Book a strategy call</span>
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
