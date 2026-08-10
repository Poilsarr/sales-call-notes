import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

export type IntegrationHealthStatus = {
  connected: boolean;
  enabled: boolean;
  syncedAt: string | null;
  configured: boolean;
  sandbox: boolean;
};

const PROVIDER_ORDER = ["hubspot", "salesforce", "teams", "slack", "google_calendar"];

const PROVIDER_LABELS: Record<string, string> = {
  hubspot: "HubSpot",
  salesforce: "Salesforce",
  teams: "Microsoft Teams",
  slack: "Slack",
  google_calendar: "Google Calendar",
};

export default function IntegrationHealth({
  integrations,
}: {
  integrations: Record<string, IntegrationHealthStatus>;
}) {
  const rows = Object.entries(integrations).sort(([a], [b]) => {
    const ai = PROVIDER_ORDER.indexOf(a);
    const bi = PROVIDER_ORDER.indexOf(b);
    return (ai === -1 ? PROVIDER_ORDER.length : ai) - (bi === -1 ? PROVIDER_ORDER.length : bi);
  });

  return (
    <Section title="Integration health" description="Credentials, connection state, and last sync for each provider.">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Provider status</CardTitle>
          <CardDescription>Live state from your workspace&apos;s stored credentials.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-5 py-4 text-xs text-white/40">No integrations configured.</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {rows.map(([provider, status]) => (
                <li key={provider} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white mb-0.5">
                      {PROVIDER_LABELS[provider] ?? provider}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
                      {status.connected ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-white/40">
                          <XCircle className="w-3 h-3" /> Disconnected
                        </span>
                      )}
                      {status.configured ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Configured
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Not configured
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        {status.syncedAt
                          ? `Last sync: ${new Date(status.syncedAt).toLocaleString()}`
                          : "Never synced"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {status.sandbox ? (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-white/30">SANDBOX</span>
                    ) : null}
                    {status.connected ? (
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3" /> Active
                      </Badge>
                    ) : status.configured ? (
                      <Badge>Ready</Badge>
                    ) : (
                      <Badge variant="warning">Not configured</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </Section>
  );
}
