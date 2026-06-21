"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/nav";
import TeamBrandingForm from "@/components/team-branding-form";
import APIKeysSettings from "@/components/api-keys-settings";
import { Calendar, Link2, CheckCircle, Loader2, Code, Download, Trash2, AlertTriangle, ShieldCheck } from "lucide-react";
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
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // CRM credential status (lightweight probe — server returns configuredProviders only)
  const [credentialStatus, setCredentialStatus] = useState<Record<string, boolean> | null>(null);
  const [credentialChecking, setCredentialChecking] = useState(true);

  useEffect(() => {
    if (tab !== "crm") return;
    let cancelled = false;
    setCredentialChecking(true);
    fetch("/api/integrations", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        try {
          return await res.json();
        } catch {
          return null;
        }
      })
      .then((data) => {
        if (cancelled || !data) return;
        setCredentialStatus(data.configuredProviders ?? null);
      })
      .catch(() => {
        /* silent — fall through to "Not set" */
      })
      .finally(() => {
        if (!cancelled) setCredentialChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const renderCredentialRow = (provider: string, label: string) => {
    const ok = credentialStatus?.[provider];
    const isChecking = credentialChecking && ok === undefined;
    return (
      <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
        <span className="text-sm text-white/70">{label}</span>
        {isChecking ? (
          <span className="text-[11px] text-white/40 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Checking…
          </span>
        ) : ok ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
            <CheckCircle className="w-3 h-3" /> Configured
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-400">
            <AlertTriangle className="w-3 h-3" /> Not set
          </span>
        )}
      </div>
    );
  };

  const envPanel = (
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

        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5">
          <h3 className="text-sm font-medium mb-3">Credential status</h3>
          {renderCredentialRow("hubspot", "HubSpot")}
          {renderCredentialRow("salesforce", "Salesforce")}
          <p className="text-[11px] text-white/40 mt-3">
            Status reflects server env vars, not your local .env. After updating Vercel env vars, restart the deployment or wait for redeploy.
          </p>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/5">
          <p className="text-sm text-white/70">
            Redirect URI used for OAuth: <span className="text-white/90">/integrations</span>
          </p>
          <p className="text-xs text-white/40 mt-2">
            Tip: keep <span className="text-white/60">NEXT_PUBLIC_APP_URL</span> set so OAuth redirects correctly.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href="/integrations"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F26522] hover:bg-[#e05a1a] text-white text-xs font-semibold transition"
          >
            <Link2 className="w-3.5 h-3.5" />
            Open Integrations page
          </a>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/50 hover:text-white underline underline-offset-2"
          >
            Manage Vercel env vars →
          </a>
        </div>
      </div>
    </div>
  );

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

  const requestExport = async () => {
    setExporting(true);
    setExportStatus("Queued. Building your export...");
    setExportDownloadUrl(null);
    try {
      const res = await fetch("/api/user/export", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setExportStatus(null);
        toast.error(data.error || "Export failed to start");
        return;
      }
      const jobId = data.jobId;
      setExportStatus("Building export... (typically under 30s)");
      // Poll status endpoint until completed
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch(`/api/user/export/${jobId}`);
        const statusData = await statusRes.json();
        if (statusData.state === "completed" && statusData.downloadUrl) {
          setExportStatus("Ready. Download link below (valid 7 days).");
          setExportDownloadUrl(statusData.downloadUrl);
          toast.success("Export ready");
          return;
        }
        if (statusData.state === "failed") {
          setExportStatus("Export failed. Please retry.");
          toast.error("Export failed");
          return;
        }
      }
      setExportStatus("Still building. Check back in a minute.");
    } catch {
      setExportStatus(null);
      toast.error("Export request failed");
    } finally {
      setExporting(false);
    }
  };

  const requestDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      toast.message("Click again within 10s to confirm account deletion.");
      setTimeout(() => setConfirmDelete(false), 10000);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Delete request failed");
        return;
      }
      toast.success("Account scheduled for deletion. Sign in within 7 days to cancel.");
      setTimeout(() => {
        window.location.href = "/sign-out";
      }, 1500);
    } catch {
      toast.error("Delete request failed");
    } finally {
      setDeleting(false);
    }
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
            <button
              onClick={() => router.replace("/settings?tab=team")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                tab === "team" ? "bg-white text-linear-black" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              Team
            </button>
            <button
              onClick={() => router.replace("/settings?tab=api-keys")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                tab === "api-keys" ? "bg-white text-linear-black" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              API Keys
            </button>
          </div>
        </div>

        {tab === "crm" ? (
          envPanel
        ) : tab === "team" ? (
          <TeamBrandingForm />
        ) : tab === "api-keys" ? (
          <APIKeysSettings />
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

          {/* GDPR / Privacy */}
          <div className="p-6 rounded-2xl bg-linear-surface border border-linear-secondary">
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="w-5 h-5 text-linear-indigo" />
                  <h2 className="text-lg font-medium">Your data &amp; privacy</h2>
                </div>
                <p className="text-sm text-white/50">
                  Export every call, action item, and audit record we hold for you — or delete your
                  account. Required by GDPR &amp; CCPA.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* EXPORT */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Download className="w-4 h-4 text-linear-indigo" />
                  <h3 className="text-sm font-medium">Export my data</h3>
                </div>
                <p className="text-xs text-white/50 mb-4 leading-relaxed">
                  We bundle all your calls, summaries, action items, comments, and audit logs into a
                  single JSON file. Link is valid for 7 days.
                </p>
                <button
                  onClick={requestExport}
                  disabled={exporting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-linear-black rounded-full text-xs font-semibold hover:bg-white/90 transition disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {exporting ? "Building export..." : "Request export"}
                </button>
                {exportStatus && (
                  <p className="text-[11px] text-white/60 mt-3">{exportStatus}</p>
                )}
                {exportDownloadUrl && (
                  <a
                    href={exportDownloadUrl}
                    className="text-[11px] text-linear-indigo hover:underline mt-2 inline-block break-all"
                  >
                    Download JSON &darr;
                  </a>
                )}
              </div>

              {/* DELETE */}
              <div className="p-5 rounded-xl bg-red-500/[0.04] border border-red-500/10">
                <div className="flex items-center gap-2 mb-3">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-medium">Delete my account</h3>
                </div>
                <p className="text-xs text-white/50 mb-4 leading-relaxed">
                  Your PII is anonymized immediately. After a 7-day grace period, all your calls,
                  comments, and team memberships are permanently deleted.
                </p>
                <button
                  onClick={requestDelete}
                  disabled={deleting}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition disabled:opacity-50 ${
                    confirmDelete
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {deleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : confirmDelete ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  {deleting ? "Scheduling..." : confirmDelete ? "Click again to confirm" : "Request deletion"}
                </button>
                {confirmDelete && (
                  <p className="text-[11px] text-red-300/80 mt-3">
                    Warning: this begins an irreversible 7-day countdown.
                  </p>
                )}
              </div>
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
