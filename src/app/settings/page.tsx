"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/nav";
import { Calendar, Link2, CheckCircle, Loader2, Code } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "general";

  useEffect(() => {
    if (authLoaded && !isSignedIn) router.replace("/sign-in");
  }, [authLoaded, isSignedIn, router]);

  const [calendarConnected, setCalendarConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const envPanel = useMemo(() => {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-linear-surface border border-linear-secondary">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Code className="w-5 h-5 text-linear-indigo" />
                <h2 className="text-lg font-medium">CRM Sync (Environment Variables)</h2>
              </div>
              <p className="text-sm text-white/50">
                Add the required OAuth credentials for HubSpot and/or Salesforce. After updating your env vars, reconnect from the Integrations page.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EnvItem
              title="HubSpot"
              items={[
                "HUBSPOT_CLIENT_ID",
                "HUBSPOT_CLIENT_SECRET",
              ]}
            />
            <EnvItem
              title="Salesforce"
              items={[
                "SALESFORCE_CLIENT_ID",
                "SALESFORCE_CLIENT_SECRET",
                "SALESFORCE_AUTH_URL (optional, defaults to login.salesforce.com)",
              ]}
            />
          </div>

          <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-sm text-white/70">
              Redirect URI used for OAuth: <span className="text-white/90">/integrations</span>
            </p>
            <p className="text-xs text-white/40 mt-2">
              Tip: keep <span className="text-white/60">NEXT_PUBLIC_APP_URL</span> set so OAuth redirects correctly.
            </p>
          </div>
        </div>
      </div>
    );
  }, []);

  const connectCalendar = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      if (data.authUrl) {
        window.open(data.authUrl, "_blank");
      } else {
        toast.error("Failed to get calendar auth URL");
      }
    } catch {
      toast.error("Could not connect to calendar service");
    }
    setConnecting(false);
  };

  return (
    <main className="min-h-screen bg-linear-black text-white">
      <Nav />
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="flex items-center justify-between mb-10 gap-4">
          <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.replace("/settings?tab=general")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                tab === "general" ? "bg-white text-linear-black" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              General
            </button>
            <button
              onClick={() => router.replace("/settings?tab=crm")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                tab === "crm" ? "bg-white text-linear-black" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              CRM Env Vars
            </button>
          </div>
        </div>

        {tab === "crm" ? (
          envPanel
        ) : (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-linear-surface border border-linear-secondary">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-linear-indigo" />
                    <h2 className="text-lg font-medium">Calendar Integration</h2>
                  </div>
                  <p className="text-sm text-white/50">Auto-detect meetings from your calendar and join them for transcription.</p>
                </div>
                {calendarConnected ? (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle className="w-3.5 h-3.5" /> Connected
                  </div>
                ) : null}
              </div>

              {calendarConnected ? (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-linear-indigo" />
                    <span className="text-white/70">Google Calendar connected</span>
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    CallNote Pro will automatically detect upcoming meetings with Zoom, Google Meet, and Microsoft Teams links.
                  </p>
                </div>
              ) : (
                <button
                  onClick={connectCalendar}
                  disabled={connecting}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-linear-black rounded-full text-xs font-semibold hover:bg-white/90 transition disabled:opacity-50"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  {connecting ? "Connecting..." : "Connect Google Calendar"}
                </button>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-linear-surface border border-linear-secondary">
              <div className="flex items-center gap-3 mb-4">
                <Link2 className="w-5 h-5 text-linear-indigo" />
                <h2 className="text-lg font-medium">Integrations</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: "HubSpot", status: "Live" },
                  { name: "Salesforce", status: "Live" },
                  { name: "Microsoft Teams", status: "Live" },
                  { name: "Google Meet", status: "Coming Soon" },
                  { name: "Zoom", status: "Coming Soon" },
                  { name: "Slack", status: "Coming Soon" },
                ].map((int, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-sm font-medium">{int.name}</span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        int.status === "Live" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {int.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 text-xs text-white/40">
                Need to configure CRM OAuth? Go to <button className="underline hover:text-white" onClick={() => router.replace("/settings?tab=crm")}>CRM Env Vars</button>.
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function EnvItem({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
      <div className="text-sm font-medium mb-3">{title}</div>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-sm text-white/70">
            <span className="w-1.5 h-1.5 rounded-full mt-2 bg-linear-indigo" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
