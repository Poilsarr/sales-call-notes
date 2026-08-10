"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, CheckCircle, Link2, Loader2 } from "lucide-react";
import IntegrationHealth from "@/components/integration-health";

type IntegrationStatus = {
  connected: boolean;
  enabled: boolean;
  syncedAt: string | null;
  configured: boolean;
  sandbox: boolean;
};

type IntegrationsStatusRecord = Record<string, IntegrationStatus>;

const PROVIDER_BY_ID: Record<string, string> = {
  hubspot: "hubspot",
  salesforce: "salesforce",
  teams: "teams",
  slack: "slack",
  google: "google_calendar",
};

const INTEGRATIONS = [
  { id: "hubspot", name: "HubSpot", category: "CRM", status: "live", description: "Sync contacts, deals, and notes" },
  { id: "salesforce", name: "Salesforce", category: "CRM", status: "live", description: "Push calls to Opportunities" },
  { id: "teams", name: "Microsoft Teams", category: "Meetings", status: "live", description: "Join and transcribe Teams calls" },
  { id: "slack", name: "Slack", category: "Messaging", status: "live", description: "Share summaries to channels" },
  { id: "google", name: "Google Calendar", category: "Calendar", status: "live", description: "Auto-detect meetings" },
  { id: "zoom", name: "Zoom", category: "Meetings", status: "soon", description: "Native bot joining" },
  { id: "meet", name: "Google Meet", category: "Meetings", status: "soon", description: "Native bot joining" },
  { id: "zapier", name: "Zapier", category: "Automation", status: "soon", description: "Trigger 5,000+ apps" },
];

export default function IntegrationsPanel() {
  const [statusRecord, setStatusRecord] = useState<IntegrationsStatusRecord | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/integrations");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.integrations) {
          setStatusRecord(data.integrations as IntegrationsStatusRecord);
        }
      } catch {
        // keep the static directory fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const calendarConnected = !!statusRecord?.["google_calendar"]?.connected;
  const calendarSandbox = !!statusRecord?.["google_calendar"]?.sandbox;

  const connectCalendar = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/integrations?action=auth-url&provider=google_calendar");
      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        toast.error(data.error || "Could not start Google sign-in");
        return;
      }
      window.location.assign(data.authUrl);
    } catch {
      toast.error("Could not connect to calendar service");
    }
    setConnecting(false);
  };

  return (
    <>
      <Section title="Connected apps" description="Manage integrations with your sales stack.">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-linear-indigo/10 flex items-center justify-center text-linear-indigo">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Google Calendar</CardTitle>
                <CardDescription>Auto-detect meetings and join them for transcription.</CardDescription>
              </div>
            </div>
            {calendarConnected ? (
              <div className="flex items-center gap-2">
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3" /> Connected
                </Badge>
                {calendarSandbox ? <SandboxTag /> : null}
              </div>
            ) : (
              <button
                onClick={connectCalendar}
                disabled={connecting}
                className="px-4 py-2 rounded-full bg-white text-linear-black text-xs font-semibold hover:bg-white/90 transition disabled:opacity-50 flex items-center gap-2"
              >
                {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                Connect
              </button>
            )}
          </CardHeader>
        </Card>
      </Section>

      {statusRecord ? <IntegrationHealth integrations={statusRecord} /> : null}

      <Section title="Integrations directory" description="Available connections for your workspace.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTEGRATIONS.map((integration) => {
            const provider = PROVIDER_BY_ID[integration.id];
            const providerStatus = provider ? statusRecord?.[provider] : undefined;

            return (
              <Card key={integration.id} className="group hover:border-white/10 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <IntegrationIcon id={integration.id} />
                    <div className="flex items-center gap-2">
                      {integration.status === "soon" ? (
                        <Badge variant="warning">Coming soon</Badge>
                      ) : !statusRecord ? (
                        <Badge variant="warning">Not configured</Badge>
                      ) : providerStatus?.connected ? (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3" /> Connected
                        </Badge>
                      ) : providerStatus?.configured ? (
                        <Badge>Ready to connect</Badge>
                      ) : (
                        <Badge>Not configured</Badge>
                      )}
                      {providerStatus?.sandbox ? <SandboxTag /> : null}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-white mb-1">{integration.name}</div>
                  <div className="text-xs text-white/40 mb-3">{integration.description}</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">{integration.category}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function SandboxTag() {
  return (
    <span className="text-[9px] font-semibold uppercase tracking-wider text-white/30">SANDBOX</span>
  );
}

function IntegrationIcon({ id }: { id: string }) {
  switch (id) {
    case "hubspot":
      return (
        <div className="w-10 h-10 rounded-xl bg-[#ff7a59]/10 flex items-center justify-center text-[#ff7a59] font-bold text-xs">
          HS
        </div>
      );
    case "salesforce":
      return (
        <div className="w-10 h-10 rounded-xl bg-[#00a1e0]/10 flex items-center justify-center text-[#00a1e0] font-bold text-xs">
          SF
        </div>
      );
    case "teams":
      return (
        <div className="w-10 h-10 rounded-xl bg-[#6264a7]/10 flex items-center justify-center text-[#6264a7] font-bold text-xs">
          TM
        </div>
      );
    case "slack":
      return (
        <div className="w-10 h-10 rounded-xl bg-[#4a154b]/10 flex items-center justify-center text-[#e01e5a] font-bold text-xs">
          SL
        </div>
      );
    case "google":
      return (
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-bold text-xs">
          GC
        </div>
      );
    case "zoom":
      return (
        <div className="w-10 h-10 rounded-xl bg-[#2d8cff]/10 flex items-center justify-center text-[#2d8cff] font-bold text-xs">
          ZM
        </div>
      );
    case "meet":
      return (
        <div className="w-10 h-10 rounded-xl bg-[#00832d]/10 flex items-center justify-center text-[#00832d] font-bold text-xs">
          GM
        </div>
      );
    case "zapier":
      return (
        <div className="w-10 h-10 rounded-xl bg-[#ff4a00]/10 flex items-center justify-center text-[#ff4a00] font-bold text-xs">
          ZP
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-bold text-xs">
          <Link2 className="w-4 h-4" />
        </div>
      );
  }
}
