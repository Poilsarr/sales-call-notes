"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Nav from "@/components/nav";
import { Zap, Sparkles, CheckCircle, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Free", price: "$0", period: "forever",
    desc: "Perfect for solo SDRs getting started.",
    features: ["300 transcription minutes/mo", "AI summaries & action items", "Speaker identification", "Basic search & history", "JSON export", "Community support"],
    cta: "Get Started", popular: false,
  },
  {
    name: "Pro", price: "$12", period: "/month per user",
    desc: "For serious SDRs who need CRM integration.",
    features: ["1,200 transcription minutes/mo", "Unlimited AI summaries", "CRM export (HubSpot, Salesforce)", "Advanced analytics dashboard", "Priority support", "90-minute call limit", "Team workspace (up to 5)"],
    cta: "Start Free Trial", popular: true,
  },
  {
    name: "Business", price: "$29", period: "/month per user",
    desc: "For sales teams scaling up.",
    features: ["6,000 transcription minutes/mo", "Microsoft Teams integration", "Custom AI workflows", "Team analytics & coaching", "Unlimited file imports", "4-hour call limit", "Admin controls & usage logs", "API access"],
    cta: "Contact Sales", popular: false,
  },
    {
    name: "Enterprise", price: "Custom", period: "",
    desc: "For organizations with advanced needs.",
    features: ["Unlimited transcription", "SSO / SAML 2.0", "HIPAA compliance", "Custom integrations", "Dedicated account manager", "On-premise deployment", "SLA guarantee", "Custom AI model training"],
    cta: "Contact Sales", popular: false, enterprise: true,
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
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-[#5e6ad2]/30">
      <Nav />

      <section className="relative min-h-[60dvh] flex flex-col items-center justify-center px-6 pt-32 pb-24 mesh-bg">
        <div className="radial-glow top-[-15%] left-[20%] bg-[#5e6ad2]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="eyebrow inline-flex items-center gap-2 mb-8 reveal"
            style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.1s", transform: "translateY(16px)", opacity: 0, filter: "blur(4px)" }}>
            <Sparkles strokeWidth={1} className="w-3 h-3" /> Simple, transparent pricing
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[0.85] mb-6 reveal"
            style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.2s", transform: "translateY(24px)", opacity: 0, filter: "blur(6px)" }}>
            Free for SDRs.<br />
            <span className="text-white/20">Scale when you need to.</span>
          </h1>
          <p className="text-white/30 max-w-xl mx-auto text-sm reveal"
            style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.3s", transform: "translateY(16px)", opacity: 0 }}>
            No hidden fees. No AI credit traps. Start free, upgrade only when your team grows.
          </p>
        </div>
      </section>

      <section className="pb-32 md:pb-44 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, i) => (
            <div key={i} className="reveal"
              style={{ transition: `all 0.8s cubic-bezier(0.25,1,0.5,1) ${0.1 + i * 0.1}s`, transform: "translateY(24px)", opacity: 0, filter: "blur(4px)" }}>
              <div className={`doppel-outer h-full flex flex-col ${plan.popular ? "border-[#5e6ad2]/40" : ""}`}>
                <div className={`doppel-inner p-6 md:p-8 h-full flex flex-col relative ${plan.popular ? "bg-[#5e6ad2]/[0.03]" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#5e6ad2] text-[10px] font-bold uppercase tracking-[0.15em] text-white whitespace-nowrap">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="font-display text-lg font-semibold tracking-tight mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                      <span className="text-sm text-white/30">{plan.period}</span>
                    </div>
                    <p className="text-xs text-white/30 mt-2">{plan.desc}</p>
                  </div>
                  <div className="flex-1 space-y-2.5 mb-8">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-start gap-2 text-xs text-white/50">
                        <CheckCircle strokeWidth={1.5} className="w-3.5 h-3.5 text-[#5e6ad2] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  {(plan as any).enterprise ? (
                    <a href="mailto:sales@callnotepro.com?subject=Enterprise%20Plan%20Inquiry"
                      className="block w-full text-center py-3 rounded-full text-xs font-semibold bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 transition-all duration-500">
                      {plan.cta}
                    </a>
                  ) : (
                    <Link href="/"
                      className={`block w-full text-center py-3 rounded-full text-xs font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        plan.popular
                          ? "bg-[#5e6ad2] text-white hover:bg-[#5e6ad2]/80"
                          : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
                      }`}>
                      {plan.cta}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-16 reveal"
          style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.5s", transform: "translateY(16px)", opacity: 0 }}>
          <div className="doppel-outer">
            <div className="doppel-inner p-8">
              <h3 className="font-display text-lg font-semibold tracking-tight mb-6 text-center">Compare to competitors</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 pr-4 text-white/30 font-medium">Feature</th>
                      <th className="text-center py-3 px-4 text-white font-medium">CallNote Pro</th>
                      <th className="text-center py-3 px-4 text-white/30 font-medium">Otter.ai</th>
                      <th className="text-center py-3 px-4 text-white/30 font-medium">Fireflies.ai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Free tier minutes", "300/mo", "300/mo", "800/mo"],
                      ["Pro price", "$12/user/mo", "$8.33/user/mo", "$10/user/mo"],
                      ["Business price", "$29/user/mo", "$19.99/user/mo", "$19/user/mo"],
                      ["AI credits system", "No credits", "Limits on free", "Yes (20-50 pool)"],
                      ["Local AI processing", "Yes", "No", "No"],
                      ["Speaker diarization", "Yes", "Yes", "Yes"],
                      ["CRM sync", "HubSpot, Salesforce", "Enterprise only", "HubSpot, Salesforce"],
                      ["Microsoft Teams", "Yes", "Yes", "Yes"],
                      ["SSO / SAML", "Enterprise", "Enterprise", "Enterprise"],
                      ["API access", "Business+", "Enterprise", "Business+"],
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-3 pr-4 text-white/50">{row[0]}</td>
                        <td className="text-center py-3 px-4 text-[#5e6ad2] font-medium">{row[1]}</td>
                        <td className="text-center py-3 px-4 text-white/30">{row[2]}</td>
                        <td className="text-center py-3 px-4 text-white/30">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
