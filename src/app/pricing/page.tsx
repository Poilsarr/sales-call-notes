"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Nav from "@/components/nav";
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react";

const plans = [
  {
    name: "Brand Identity", price: "$8,500", period: "starting",
    desc: "For startups and growing brands needing a complete visual identity.",
    features: ["Brand strategy & positioning", "Logo system (primary, secondary, icon)", "Color palette & typography", "Brand guidelines PDF", "Social media kit", "Business card & stationery"],
    cta: "Get Started", popular: false,
  },
  {
    name: "Web Design", price: "$15,000", period: "starting",
    desc: "High-conversion marketing websites and landing pages.",
    features: ["UX strategy & user flows", "Wireframing & prototyping", "Custom UI design (up to 8 pages)", "Responsive Webflow/Framer build", "Content population", "Post-launch support (30 days)"],
    cta: "Start a Project", popular: true,
  },
  {
    name: "Growth", price: "$28,000", period: "starting",
    desc: "Full-service design & development for ambitious product launches.",
    features: ["Everything in Web Design", "Custom web application UI", "Motion design & micro-interactions", "Conversion optimization", "CRM & analytics setup", "Dedicated project manager", "Priority support (60 days)"],
    cta: "Book a Call", popular: false,
  },
  {
    name: "Enterprise", price: "Custom", period: "",
    desc: "For organizations with complex design needs at scale.",
    features: ["Design system architecture", "Component library development", "Multi-product brand unification", "Team workshops & training", "Ongoing retainer options", "Dedicated creative director", "Same-day turnaround"],
    cta: "Contact Us", popular: false, enterprise: true,
  },
];

export default function PricingPage() {
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
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] sm:text-[12px] font-semibold">3</div>
              <span className="text-[12px] sm:text-[13px] font-medium border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">Investment</span>
            </div>
            <h1 className="font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 mb-6 reveal"
              style={{ fontSize: "clamp(2rem,5vw,4.2rem)", transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.2s", transform: "translateY(24px)", opacity: 0, filter: "blur(6px)" }}>
              Invest in your<br />brand&apos;s future.
            </h1>
            <p className="text-[16px] sm:text-[17px] leading-[1.6] text-gray-500 max-w-xl reveal"
              style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.3s", transform: "translateY(16px)", opacity: 0 }}>
              Transparent pricing. No hidden fees. Every project includes strategy, design, and development.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24 sm:pb-32 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {plans.map((plan, i) => (
            <div key={i} className="reveal"
              style={{ transition: `all 0.8s cubic-bezier(0.25,1,0.5,1) ${0.1 + i * 0.1}s`, transform: "translateY(24px)", opacity: 0, filter: "blur(4px)" }}>
              <div className={`bg-white rounded-2xl border h-full flex flex-col ${plan.popular ? "border-[#F26522]/40 ring-1 ring-[#F26522]/20" : "border-gray-200"}`}>
                <div className="p-6 sm:p-8 h-full flex flex-col relative">
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#F26522] text-[10px] font-bold uppercase tracking-[0.15em] text-white whitespace-nowrap">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-[17px] font-semibold tracking-tight mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                      <span className="text-sm text-gray-400">{plan.period}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{plan.desc}</p>
                  </div>
                  <div className="flex-1 space-y-2.5 mb-8">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-start gap-2 text-xs text-gray-500">
                        <CheckCircle strokeWidth={1.5} className="w-3.5 h-3.5 text-[#F26522] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  {plan.enterprise ? (
                    <a href="mailto:hello@axionstudio.com?subject=Enterprise%20Inquiry"
                      className="block w-full text-center py-3 rounded-full text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300">
                      {plan.cta}
                    </a>
                  ) : (
                    <Link href="/"
                      className={`block w-full text-center py-3 rounded-full text-xs font-semibold transition-all duration-300 ${
                        plan.popular
                          ? "bg-[#F26522] text-white hover:bg-[#e05a1a]"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}>
                      {plan.cta}
                    </Link>
                  )}
                </div>
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
              Not sure which package fits?
            </h2>
            <p className="text-[15px] leading-[1.6] text-gray-500 mb-8 max-w-lg mx-auto">
              We&apos;ll help you scope the perfect engagement. No commitment required.
            </p>
            <Link href="/" className="group bg-[#F26522] hover:bg-[#e05a1a] text-white rounded-full pl-5 pr-2 py-2 inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-300">
              <span className="flex flex-col overflow-hidden h-[20px]">
                <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">Book a free consultation</span>
                <span className="leading-[20px]">Book a free consultation</span>
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
