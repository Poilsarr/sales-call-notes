"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Nav from "@/components/nav";
import { Zap, Sparkles, Building2, BarChart3, MessageSquare, Calendar, Globe, Code, Layers, Share2, Users, Download, ArrowRight } from "lucide-react";

const integrations = [
  { icon: <Building2 strokeWidth={1} className="w-6 h-6" />, name: "HubSpot", desc: "Sync call notes and action items directly to HubSpot CRM deals and contacts.", status: "Live" },
  { icon: <BarChart3 strokeWidth={1} className="w-6 h-6" />, name: "Salesforce", desc: "Push transcripts, summaries, and tasks to Salesforce opportunities.", status: "Live" },
  { icon: <MessageSquare strokeWidth={1} className="w-6 h-6" />, name: "Microsoft Teams", desc: "Create Planner tasks and send channel messages with call summaries.", status: "Live" },
  { icon: <Calendar strokeWidth={1} className="w-6 h-6" />, name: "Google Calendar", desc: "Auto-join meetings and transcribe from your calendar events.", status: "Coming Soon" },
  { icon: <Calendar strokeWidth={1} className="w-6 h-6" />, name: "Outlook Calendar", desc: "Sync meetings from Microsoft 365 calendar for automatic capture.", status: "Coming Soon" },
  { icon: <Globe strokeWidth={1} className="w-6 h-6" />, name: "Zoom", desc: "Record and transcribe Zoom meetings directly from the platform.", status: "Coming Soon" },
  { icon: <Globe strokeWidth={1} className="w-6 h-6" />, name: "Google Meet", desc: "Live transcription and note-taking for Google Meet calls.", status: "Coming Soon" },
  { icon: <Layers strokeWidth={1} className="w-6 h-6" />, name: "Slack", desc: "Post call summaries and action items to Slack channels automatically.", status: "Coming Soon" },
  { icon: <Share2 strokeWidth={1} className="w-6 h-6" />, name: "Zapier", desc: "Connect CallNote Pro to 5,000+ apps via Zapier workflows.", status: "Coming Soon" },
  { icon: <Code strokeWidth={1} className="w-6 h-6" />, name: "REST API", desc: "Build custom integrations with our full-featured REST API.", status: "Business+" },
  { icon: <Download strokeWidth={1} className="w-6 h-6" />, name: "Webhooks", desc: "Receive real-time events when calls are transcribed and analyzed.", status: "Business+" },
  { icon: <Users strokeWidth={1} className="w-6 h-6" />, name: "SSO / SAML 2.0", desc: "Enterprise single sign-on via SAML 2.0, Google, or Microsoft.", status: "Enterprise" },
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
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-[#5e6ad2]/30">
      <Nav />

      <section className="relative min-h-[60dvh] flex flex-col items-center justify-center px-6 pt-32 pb-24 mesh-bg">
        <div className="radial-glow top-[-10%] left-[-5%] bg-[#5e6ad2]" />
        <div className="radial-glow bottom-[-20%] right-[-10%] bg-[#22d3a8]" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="eyebrow inline-flex items-center gap-2 mb-8 reveal"
            style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.1s", transform: "translateY(16px)", opacity: 0, filter: "blur(4px)" }}>
            <Sparkles strokeWidth={1} className="w-3 h-3" /> Connect your stack
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[0.85] mb-6 reveal"
            style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.2s", transform: "translateY(24px)", opacity: 0, filter: "blur(6px)" }}>
            Works where<br />
            <span className="text-white/20">you already work</span>
          </h1>
          <p className="text-white/30 max-w-xl mx-auto text-sm reveal"
            style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.3s", transform: "translateY(16px)", opacity: 0 }}>
            CallNote Pro integrates with your CRM, calendar, and communication tools.
          </p>
        </div>
      </section>

      <section className="pb-32 md:pb-44 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((int, i) => (
            <div key={i} className="reveal"
              style={{ transition: `all 0.8s cubic-bezier(0.25,1,0.5,1) ${0.05 + i * 0.05}s`, transform: "translateY(24px)", opacity: 0, filter: "blur(4px)" }}>
              <div className="doppel-outer h-full group">
                <div className="doppel-inner p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-white/10 transition-all duration-700">{int.icon}</div>
                    <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                      int.status === "Live" ? "bg-green-500/10 text-green-400" :
                      int.status === "Coming Soon" ? "bg-yellow-500/10 text-yellow-400" :
                      int.status === "Business+" ? "bg-[#5e6ad2]/10 text-[#5e6ad2]" :
                      "bg-white/10 text-white/50"
                    }`}>{int.status}</span>
                  </div>
                  <h3 className="font-display font-semibold tracking-tight text-base mb-2">{int.name}</h3>
                  <p className="text-sm text-white/40 font-[425] leading-relaxed">{int.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-16 text-center reveal"
          style={{ transition: "all 0.8s cubic-bezier(0.25,1,0.5,1) 0.6s", transform: "translateY(16px)", opacity: 0 }}>
          <div className="doppel-outer">
            <div className="doppel-inner p-12 md:p-16">
              <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-4">Need a custom integration?</h2>
              <p className="text-white/30 mb-8 text-sm">We support custom integrations via our REST API and webhooks.</p>
              <Link href="/"
                className="btn-island inline-flex items-center gap-3 bg-white text-[#050505] hover:bg-white/90 group">
                Get Started Free
                <span className="icon-wrap bg-[#050505]/10 group-hover:bg-[#050505]/15">
                  <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
