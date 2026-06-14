"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Nav from "@/components/nav";
import { motion } from "framer-motion";
import {
  Sparkles, Building2, BarChart3, MessageSquare, Calendar, Globe,
  Code, Layers, Share2, Users, Download, ArrowRight,
  CheckCircle2, Loader2, Link2, Unplug, Zap, AlertCircle, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

type SupportedProvider = "hubspot" | "salesforce" | "teams" | "slack";

type ProviderStatus = {
  connected: boolean;
  enabled: boolean;
  syncedAt: string | null;
  configured: boolean;
  error?: string;
};

const providerColors: Record<string, string> = {
  hubspot: "#FF5C35", salesforce: "#00A1E0", teams: "#6264A7", slack: "#4A154B",
  google: "#4285F4", outlook: "#0078D4", zoom: "#2D8CFF", meet: "#34A853",
};

function IntegrationIcon({ name, provider }: { name: string; provider?: string }) {
  const initial = name.charAt(0);
  const color = provider ? (providerColors[provider] || "#6b7280") : "#6b7280";
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-semibold shrink-0"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
      {initial}
    </div>
  );
}

const integrationsData = [
  { icon: <Building2 size={18} />, name: "HubSpot", desc: "Sync call notes and action items to HubSpot CRM.", status: "Live", provider: "hubspot" as const },
  { icon: <BarChart3 size={18} />, name: "Salesforce", desc: "Push transcripts and tasks to Salesforce opportunities.", status: "Live", provider: "salesforce" as const },
  { icon: <MessageSquare size={18} />, name: "Microsoft Teams", desc: "Create Planner tasks and send call summaries to channels.", status: "Live", provider: "teams" as const },
  { icon: <Calendar size={18} />, name: "Google Calendar", desc: "Auto-join meetings and transcribe from calendar events.", status: "Coming Soon" },
  { icon: <Calendar size={18} />, name: "Outlook Calendar", desc: "Sync from Microsoft 365 calendar.", status: "Coming Soon" },
  { icon: <Globe size={18} />, name: "Zoom", desc: "Record and transcribe Zoom meetings directly.", status: "Coming Soon" },
  { icon: <Globe size={18} />, name: "Google Meet", desc: "Live transcription for Google Meet calls.", status: "Coming Soon" },
  { icon: <Layers size={18} />, name: "Slack", desc: "Post summaries, action items, and weekly digests.", status: "Live", provider: "slack" as const },
  { icon: <Share2 size={18} />, name: "Zapier", desc: "Connect to 5,000+ apps via Zapier.", status: "Coming Soon" },
  { icon: <Code size={18} />, name: "REST API", desc: "Full-featured API for custom integrations.", status: "Business+" },
  { icon: <Download size={18} />, name: "Webhooks", desc: "Real-time events on transcription complete.", status: "Business+" },
  { icon: <Users size={18} />, name: "SSO / SAML 2.0", desc: "Enterprise SSO via SAML, Google, or Microsoft.", status: "Enterprise" },
];

const envVarsByProvider: Record<string, { title: string; vars: string[] }> = {
  hubspot: { title: "HubSpot", vars: ["HUBSPOT_CLIENT_ID", "HUBSPOT_CLIENT_SECRET"] },
  salesforce: { title: "Salesforce", vars: ["SALESFORCE_CLIENT_ID", "SALESFORCE_CLIENT_SECRET", "SALESFORCE_AUTH_URL (optional)"] },
  teams: { title: "Microsoft Teams", vars: ["TEAMS_CLIENT_ID", "TEAMS_CLIENT_SECRET"] },
  slack: { title: "Slack", vars: ["SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET", "SLACK_SIGNING_SECRET"] },
};

function SetupGuide() {
  const [open, setOpen] = useState<string | null>(null);
  const entries = Object.entries(envVarsByProvider);

  return (
    <section className="px-5 sm:px-8 lg:px-12 pb-12">
      <div className="max-w-[1440px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-5">
          <div className="eyebrow inline-flex items-center gap-2 mb-3"><Zap size={12} /> Setup Guide</div>
          <h2 className="text-[clamp(1.1rem,2.5vw,1.75rem)] font-medium tracking-tight mb-1">OAuth environment variables</h2>
          <p className="text-[12px] text-gray-500 max-w-lg mx-auto">
            Add these to your Vercel project or <code className="text-[#F26522] bg-[#F26522]/8 px-1 rounded">.env.local</code>.
            Redirect URI: <code className="text-gray-600 bg-gray-100 px-1 rounded">/integrations</code>
          </p>
        </motion.div>
        <div className="max-w-2xl mx-auto space-y-2">
          {entries.map(([key, p]) => {
            const isO = open === key;
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <button onClick={() => setOpen(isO ? null : key)} className="w-full doppel-outer group text-left cursor-pointer">
                  <div className="doppel-inner px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IntegrationIcon name={p.title} provider={key} />
                      <span className="text-[13px] font-medium">{p.title}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{p.vars.length} vars</span>
                    </div>
                    <ChevronDown size={15} className={`text-gray-400 transition-transform duration-300 ${isO ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: isO ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden">
                    <div className="doppel-outer mt-1">
                      <div className="doppel-inner px-4 py-3">
                        <ul className="space-y-1.5">
                          {p.vars.map((v) => (
                            <li key={v} className="flex items-center gap-2 text-[12px] font-mono">
                              <span className="w-1 h-1 rounded-full bg-[#F26522] shrink-0" />
                              <code className="text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded text-[11px]">{v}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function IntegrationsContent() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoaded && !isSignedIn) router.replace("/sign-in");
  }, [authLoaded, isSignedIn, router]);

  const searchParams = useSearchParams();
  const [providerStates, setProviderStates] = useState<Record<SupportedProvider, ProviderStatus>>({
    hubspot: { connected: false, enabled: false, syncedAt: null, configured: false },
    salesforce: { connected: false, enabled: false, syncedAt: null, configured: false },
    teams: { connected: false, enabled: false, syncedAt: null, configured: false },
    slack: { connected: false, enabled: false, syncedAt: null, configured: false },
  });
  const [providerLoading, setProviderLoading] = useState<Record<SupportedProvider, boolean>>({
    hubspot: false, salesforce: false, teams: false, slack: false,
  });
  const handledCallbackRef = useRef(false);

  const loadProviderStates = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load integrations");
      setProviderStates(data.integrations);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load integrations");
    }
  }, []);

  useEffect(() => { void loadProviderStates(); }, [loadProviderStates]);

  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const providerParam = stateParam?.split(":")[0] ?? null;
  const slackConnected = searchParams.get("slack");
  const teamsConnected = searchParams.get("teams");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    const provider = providerParam;

    if (handledCallbackRef.current) return;

    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error && provider !== "slack") {
      handledCallbackRef.current = true;
      toast.error(errorDescription || `Connection failed: ${error}`);
      router.replace("/integrations");
      return;
    }

    if (slackConnected === "connected") {
      handledCallbackRef.current = true;
      toast.success("Slack connected");
      setProviderStates((prev) => ({
        ...prev,
        slack: { ...prev.slack, connected: true, enabled: true, syncedAt: new Date().toISOString(), error: undefined },
      }));
      router.replace("/integrations");
      return;
    }

    if (teamsConnected === "connected") {
      handledCallbackRef.current = true;
      toast.success("Microsoft Teams connected");
      setProviderStates((prev) => ({
        ...prev,
        teams: { ...prev.teams, connected: true, enabled: true, syncedAt: new Date().toISOString(), error: undefined },
      }));
      router.replace("/integrations");
      return;
    }

    if (errorParam && errorParam.startsWith("slack_")) {
      handledCallbackRef.current = true;
      toast.error(decodeURIComponent(errorParam.replace("slack_", "")));
      router.replace("/integrations");
      return;
    }

    if (errorParam && errorParam.startsWith("teams_")) {
      handledCallbackRef.current = true;
      toast.error(decodeURIComponent(errorParam.replace("teams_", "")));
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
          body: JSON.stringify({ provider, code, state: stateParam }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to save integration");
        setProviderStates((prev) => ({
          ...prev,
          [provider]: { ...prev[provider], connected: true, enabled: true, syncedAt: new Date().toISOString(), error: undefined },
        }));
        toast.success(`${integrationsData.find((item) => item.provider === provider)?.name || "Provider"} connected`);
      } catch (callbackError) {
        const msg = callbackError instanceof Error ? callbackError.message : "Could not complete connection";
        setProviderStates((prev) => ({ ...prev, [provider]: { ...prev[provider], error: msg } }));
        toast.error(msg);
      } finally {
        setProviderLoading((current) => ({ ...current, [provider]: false }));
        router.replace("/integrations");
      }
    })();
  }, [router, code, providerParam, searchParams, stateParam, slackConnected, teamsConnected, errorParam]);

  const connectProvider = async (provider: SupportedProvider) => {
    if (!providerStates[provider].configured) {
      toast.error("OAuth credentials are not configured for this provider yet.");
      return;
    }
    setProviderLoading((current) => ({ ...current, [provider]: true }));
    setProviderStates((prev) => ({ ...prev, [provider]: { ...prev[provider], error: undefined } }));
    try {
      const authUrl = provider === "slack"
        ? "/api/integrations/slack/connect"
        : provider === "teams"
        ? "/api/integrations/teams/connect"
        : await fetch(`/api/integrations?action=auth-url&provider=${provider}`).then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || "Failed to start OAuth flow");
            return data.authUrl;
          });
      window.location.assign(authUrl);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not start OAuth flow";
      setProviderStates((prev) => ({ ...prev, [provider]: { ...prev[provider], error: msg } }));
      toast.error(msg);
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
      setProviderStates((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], connected: false, enabled: false, syncedAt: null, error: undefined },
      }));
      toast.success(`${integrationsData.find((item) => item.provider === provider)?.name || "Provider"} disconnected`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not disconnect integration";
      setProviderStates((prev) => ({ ...prev, [provider]: { ...prev[provider], error: msg } }));
      toast.error(msg);
    } finally {
      setProviderLoading((current) => ({ ...current, [provider]: false }));
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-hidden selection:bg-[#F26522]/20">
      <Nav />

      {/* Hero */}
      <section className="relative pt-28 pb-10 px-5 sm:px-8 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div className="radial-glow top-[-15%] right-[5%]" style={{ background: "#F26522" }} />
        <div className="radial-glow bottom-[-15%] left-[5%]" style={{ background: "#2563eb" }} />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="eyebrow inline-flex items-center gap-2 mb-5"><Sparkles size={12} /> Connect your stack</div>
          </motion.div>
          <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-3">
            Works where<br /><span className="text-gray-400">you already work</span>
          </motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[14px] text-gray-500 max-w-lg mx-auto leading-relaxed">
            CallNote Pro integrates with your CRM, calendar, and communication tools. No juggling tabs.
          </motion.p>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="px-5 sm:px-8 lg:px-12 pb-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {integrationsData.map((int, i) => {
            const isCfg = int.provider ? providerStates[int.provider].configured : true;
            const bText = int.provider ? (isCfg ? int.status : "Setup Required") : int.status;
            const bCls = !isCfg && int.provider
              ? "bg-amber-50 text-amber-600 border border-amber-200"
              : int.status === "Live" ? "bg-green-50 text-green-600 border border-green-200"
              : int.status === "Coming Soon" ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
              : int.status === "Business+" ? "bg-[#F26522]/8 text-[#F26522] border border-[#F26522]/20"
              : "bg-gray-50 text-gray-500 border border-gray-200";
            const ps = int.provider ? providerStates[int.provider] : null;
            const pl = int.provider ? providerLoading[int.provider] : false;
            return (
              <motion.div key={int.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.35 }}>
                <div className="doppel-outer h-full group">
                  <div className="doppel-inner p-4 h-full flex flex-col relative transition-shadow duration-300 hover:shadow-md">
                    <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: "radial-gradient(400px circle at 50% 50%, rgba(242,101,34,0.06), transparent 60%)" }} />
                    <div className="flex items-start justify-between mb-2.5 relative">
                      {int.provider ? <IntegrationIcon name={int.name} provider={int.provider} /> : <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">{int.icon}</div>}
                      <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${bCls}`}>{bText}</span>
                    </div>
                    <h3 className="text-[14px] font-semibold tracking-tight mb-1 relative">{int.name}</h3>
                    <p className="text-[12px] text-gray-500 leading-relaxed flex-1 relative">{int.desc}</p>
                    {ps && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 relative">
                        {ps.error && (
                          <div className="flex items-start gap-1.5 mb-2 text-[11px] text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg">
                            <AlertCircle size={12} className="shrink-0 mt-0.5" /><span>{ps.error}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[12px] font-medium min-w-0">
                            {ps.connected ? <CheckCircle2 size={14} className="text-green-600 shrink-0" /> : <Link2 size={14} className="text-gray-400 shrink-0" />}
                            <span className={ps.connected ? "text-green-600" : "text-gray-500"}>
                              {ps.connected ? "Connected" : isCfg ? "OAuth required" : "Not configured"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {ps.connected ? (
                              <>
                                {(int.provider === "hubspot" || int.provider === "salesforce") && (
                                  <button onClick={() => toast.success(`CRM sync started for ${int.name}.`)} disabled={pl}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#F26522] text-white text-[10px] font-semibold hover:bg-[#e05a1a] transition-all disabled:opacity-50">
                                    <Sparkles size={12} /> Sync
                                  </button>
                                )}
                                <button onClick={() => disconnectProvider(int.provider!)} disabled={pl}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-gray-200 text-[10px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50">
                                  {pl ? <Loader2 size={12} className="animate-spin" /> : <Unplug size={12} />}
                                  {int.provider !== "hubspot" && int.provider !== "salesforce" && "Disconnect"}
                                </button>
                              </>
                            ) : isCfg ? (
                              <button onClick={() => connectProvider(int.provider!)} disabled={pl}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F26522] text-white text-[10px] font-semibold hover:bg-[#e05a1a] transition-all disabled:opacity-50">
                                {pl ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                                Connect
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 sm:px-8 lg:px-12 pb-8">
        <div className="max-w-[1440px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="doppel-outer group">
              <div className="doppel-inner p-8 sm:p-12 text-center relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-[clamp(1.1rem,2.5vw,2rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-2">Need a custom integration?</h2>
                  <p className="text-gray-500 mb-6 text-[13px]">We support custom builds via our REST API and webhooks.</p>
                  <Link href="/sign-up"
                    className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300">
                    <span className="flex flex-col overflow-hidden h-[20px]">
                      <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">Get started free</span>
                      <span className="leading-[20px]">Get started free</span>
                    </span>
                    <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                      <ArrowRight size={14} className="text-[#F26522]" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <SetupGuide />
    </main>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </main>
    }>
      <IntegrationsContent />
    </Suspense>
  );
}
