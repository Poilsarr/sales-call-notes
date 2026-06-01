"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/nav";
import {
  Sparkles, Building2, BarChart3, MessageSquare, Calendar, Globe,
  Code, Layers, Share2, Users, Download, ArrowRight,
  CheckCircle2, Loader2, Link2, Unplug, Zap,
} from "lucide-react";
import { toast } from "sonner";

type SupportedProvider = "hubspot" | "salesforce" | "teams";

type ProviderStatus = {
  connected: boolean;
  enabled: boolean;
  syncedAt: string | null;
};

const integrations = [
  { icon: <Building2 size={22} />, name: "HubSpot", desc: "Sync call notes and action items directly to HubSpot CRM deals and contacts.", status: "Live", provider: "hubspot" as const },
  { icon: <BarChart3 size={22} />, name: "Salesforce", desc: "Push transcripts, summaries, and tasks to Salesforce opportunities.", status: "Live", provider: "salesforce" as const },
  { icon: <MessageSquare size={22} />, name: "Microsoft Teams", desc: "Create Planner tasks and send channel messages with call summaries.", status: "Live", provider: "teams" as const },
  { icon: <Calendar size={22} />, name: "Google Calendar", desc: "Auto-join meetings and transcribe from your calendar events.", status: "Coming Soon" },
  { icon: <Calendar size={22} />, name: "Outlook Calendar", desc: "Sync meetings from Microsoft 365 calendar for automatic capture.", status: "Coming Soon" },
  { icon: <Globe size={22} />, name: "Zoom", desc: "Record and transcribe Zoom meetings directly from the platform.", status: "Coming Soon" },
  { icon: <Globe size={22} />, name: "Google Meet", desc: "Live transcription and note-taking for Google Meet calls.", status: "Coming Soon" },
  { icon: <Layers size={22} />, name: "Slack", desc: "Post call summaries and action items to Slack channels automatically.", status: "Coming Soon" },
  { icon: <Share2 size={22} />, name: "Zapier", desc: "Connect CallNote Pro to 5,000+ apps via Zapier workflows.", status: "Coming Soon" },
  { icon: <Code size={22} />, name: "REST API", desc: "Build custom integrations with our full-featured REST API.", status: "Business+" },
  { icon: <Download size={22} />, name: "Webhooks", desc: "Receive real-time events when calls are transcribed and analyzed.", status: "Business+" },
  { icon: <Users size={22} />, name: "SSO / SAML 2.0", desc: "Enterprise single sign-on via SAML 2.0, Google, or Microsoft.", status: "Enterprise" },
];

export default function IntegrationsPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const handledCallbackRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [providerStates, setProviderStates] = useState<Record<SupportedProvider, ProviderStatus>>({
    hubspot: { connected: false, enabled: false, syncedAt: null },
    salesforce: { connected: false, enabled: false, syncedAt: null },
    teams: { connected: false, enabled: false, syncedAt: null },
  });
  const [providerLoading, setProviderLoading] = useState<Record<SupportedProvider, boolean>>({
    hubspot: false,
    salesforce: false,
    teams: false,
  });

  const loadProviderStates = async () => {
    try {
      const response = await fetch("/api/integrations", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load integrations");
      }
      setProviderStates(data.integrations);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load integrations");
    }
  };

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observerRef.current?.unobserve(e.target);
          }
        });
      }, { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    void loadProviderStates();
  }, []);

  useEffect(() => {
    const code = searchParams.get("code");
    const provider = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (handledCallbackRef.current) return;

    if (error) {
      handledCallbackRef.current = true;
      toast.error(errorDescription || `Connection failed: ${error}`);
      router.replace("/integrations");
      return;
    }

    if (!code || (provider !== "hubspot" && provider !== "salesforce" && provider !== "teams")) return;

    handledCallbackRef.current = true;
    setProviderLoading((current) => ({ ...current, [provider]: true }));

    void (async () => {
      try {
        const response = await fetch("/api/integrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, code }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to save integration");
        await loadProviderStates();
        toast.success(`${integrations.find((item) => item.provider === provider)?.name || "Provider"} connected`);
      } catch (callbackError) {
        toast.error(callbackError instanceof Error ? callbackError.message : "Could not complete connection");
      } finally {
        setProviderLoading((current) => ({ ...current, [provider]: false }));
        router.replace("/integrations");
      }
    })();
  }, [router, searchParams]);

  const connectProvider = async (provider: SupportedProvider) => {
    setProviderLoading((current) => ({ ...current, [provider]: true }));
    try {
      const response = await fetch(`/api/integrations?action=auth-url&provider=${provider}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to start OAuth flow");
      window.location.assign(data.authUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start OAuth flow");
      setProviderLoading((current) => ({ ...current, [provider]: false }));
    }
  };

  const disconnectProvider = async (provider: SupportedProvider) => {
    setProviderLoading((current) => ({ ...current, [provider]: true }));
    try {
      const response = await fetch("/api/integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to disconnect integration");
      await loadProviderStates();
      toast.success(`${integrations.find((item) => item.provider === provider)?.name || "Provider"} disconnected`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not disconnect integration");
    } finally {
      setProviderLoading((current) => ({ ...current, [provider]: false }));
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />

      {/* Hero */}
      <section className="pt-36 pb-16 sm:pt-40 sm:pb-20 px-5 sm:px-8 lg:px-12 bg-[#EFEFEF] overflow-hidden">
        <div className="max-w-[1440px] mx-auto text-center">
          <div className="eyebrow inline-flex items-center gap-2 mb-6 reveal">
            <Sparkles size={12} /> Connect your stack
          </div>
          <h1 className="text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-4">
            Works where<br />
            <span className="text-gray-400">you already work</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-[14px]">
            CallNote Pro integrates with your CRM, calendar, and communication tools.
          </p>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-12 sm:py-16 lg:py-20 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((int, i) => (
            <div key={int.name} className="reveal" style={{ transitionDelay: `${i * 0.04}s` }}>
              <div className="doppel-outer h-full group">
                <div className="doppel-inner p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-gray-900 group-hover:bg-gray-200 transition-all duration-500">
                      {int.icon}
                    </div>
                    <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                      int.status === "Live" ? "bg-green-100 text-green-700" :
                      int.status === "Coming Soon" ? "bg-yellow-100 text-yellow-700" :
                      int.status === "Business+" ? "bg-[#F26522]/10 text-[#F26522]" :
                      "bg-gray-100 text-gray-500"
                    }`}>{int.status}</span>
                  </div>
                  <h3 className="text-[14px] font-semibold tracking-tight mb-1.5">{int.name}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed flex-1">{int.desc}</p>
                  {int.provider ? (
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        {providerStates[int.provider].connected ? (
                          <>
                            <div className="flex items-center gap-2 text-[13px] text-green-600">
                              <CheckCircle2 size={15} />
                              <span>Connected</span>
                            </div>
                            {providerStates[int.provider].syncedAt && (
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Updated {new Date(providerStates[int.provider].syncedAt as string).toLocaleDateString()}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-[13px] text-gray-600">
                              <Link2 size={15} />
                              <span>OAuth required</span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">Connect to save access tokens.</p>
                          </>
                        )}
                      </div>
                      {providerStates[int.provider].connected ? (
                        <button
                          onClick={() => disconnectProvider(int.provider)}
                          disabled={providerLoading[int.provider]}
                          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                          {providerLoading[int.provider] ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Unplug size={14} />
                          )}
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => connectProvider(int.provider)}
                          disabled={providerLoading[int.provider]}
                          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F26522] text-white text-[11px] font-semibold hover:bg-[#e05a1a] transition-all disabled:opacity-50"
                        >
                          {providerLoading[int.provider] ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <ArrowRight size={14} />
                          )}
                          Connect
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 reveal">
          <div className="doppel-outer group">
            <div className="doppel-inner p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-[clamp(1.25rem,3vw,2.25rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3">
                  Need a custom integration?
                </h2>
                <p className="text-gray-500 mb-8 text-[14px]">We support custom integrations via our REST API and webhooks.</p>
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300"
                >
                  <span className="flex flex-col overflow-hidden h-[20px]">
                    <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                      Get started free
                    </span>
                    <span className="leading-[20px]">Get started free</span>
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
