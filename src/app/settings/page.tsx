"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/nav";
import TeamBrandingForm from "@/components/team-branding-form";
import TeamVocabularySettings from "@/components/team-vocabulary-settings";
import APIKeysSettings from "@/components/api-keys-settings";
import ByokSettings from "@/components/byok-settings";
import IntegrationsPanel from "@/components/settings/integrations-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { NavTabs } from "@/components/ui/nav-tabs";
import { Avatar } from "@/components/ui/avatar";
import { getPlan, hasFeature, type FeatureId, type PlanTier } from "@/lib/plans";
import { toast } from "sonner";
import { Toaster } from "sonner";
import {
  User,
  CreditCard,
  Bell,
  Sliders,
  Link2,
  ShieldCheck,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Palette,
  Key,
  Code,
  Zap,
  Globe,
  Clock,
  Mail,
  Crown,
  Users,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface BillingInfo {
  plan: PlanTier;
  usage: number;
  minuteUsage: number;
  limit: number | "unlimited";
  minuteLimit: number | "unlimited";
  teamMemberCount: number;
  teamMemberLimit: number | "unlimited";
  features: Partial<Record<FeatureId, boolean | number>>;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  trialEndsAt: string | null;
  cancellationEffectiveDate: string | null;
}

export default function SettingsPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (authLoaded && !isSignedIn) router.replace("/sign-in");
  }, [authLoaded, isSignedIn, router]);

  return (
    <Suspense fallback={null}>
      <SettingsContent user={user} />
    </Suspense>
  );
}

function SettingsContent({ user }: { user: ReturnType<typeof useUser>["user"] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "general";

  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);

  // Notifications
  const [emailDigest, setEmailDigest] = useState(true);
  const [actionReminders, setActionReminders] = useState(true);
  const [teamAlerts, setTeamAlerts] = useState(true);

  // Preferences
  const [autoShare, setAutoShare] = useState(false);
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("balanced");

  // GDPR
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetch("/api/billing", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setBilling(d))
      .catch(() => setBilling(null))
      .finally(() => setBillingLoading(false));
  }, []);

  const setTab = (id: string) => router.replace(`/settings?tab=${id}`);

  const tabs = [
    { id: "general", label: "General", icon: <User className="w-4 h-4" /> },
    { id: "workspace", label: "Workspace", icon: <Users className="w-4 h-4" /> },
    { id: "integrations", label: "Integrations", icon: <Link2 className="w-4 h-4" /> },
    { id: "api-keys", label: "API Keys", icon: <Key className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const plan = billing ? getPlan(billing.plan) : getPlan("free");
  const usagePct =
    typeof billing?.limit === "number" && billing.limit > 0
      ? Math.min(100, (billing.usage / billing.limit) * 100)
      : 0;
  const minutePct =
    typeof billing?.minuteLimit === "number" && billing.minuteLimit > 0
      ? Math.min(100, (billing.minuteUsage / billing.minuteLimit) * 100)
      : 0;
  const teamPct =
    typeof billing?.teamMemberLimit === "number" && billing.teamMemberLimit > 0
      ? Math.min(100, (billing.teamMemberCount / billing.teamMemberLimit) * 100)
      : 0;

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
    <>
      <Nav />
    <main id="main" className="min-h-screen bg-linear-black text-white">

      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#141416',
            color: '#ffffff',
            border: '1px solid #1c1c20',
          },
        }}
      />
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-24">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-28">
              <h1 className="text-2xl font-medium tracking-tight mb-6">Settings</h1>
              <NavTabs tabs={tabs} active={tab} onChange={setTab} orientation="vertical" />
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === "workspace" && (
              <>
                <Section title="Workspace" description="Team branding and workspace identity.">
                  <TeamBrandingForm />
                </Section>
                <Section title="Team vocabulary" description="Teach Gauge your internal terms — applied to every new call analysis.">
                  <TeamVocabularySettings />
                </Section>
              </>
            )}

            {tab === "integrations" && (
              <IntegrationsPanel />
            )}

            {tab === "api-keys" && (
              <Section title="API Keys" description="Manage programmatic access to your Gauge account.">
                <APIKeysSettings />
                <div className="mt-6">
                  <ByokSettings />
                </div>
              </Section>
            )}

            {tab === "security" && (
              <>
                <Section title="Data & privacy" description="Export or permanently delete your account data.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-linear-indigo/10 flex items-center justify-center text-linear-indigo">
                            <Download className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle>Export my data</CardTitle>
                            <CardDescription>Download everything we store about you.</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-white/50 mb-4">
                          We bundle all your calls, summaries, action items, comments, and audit logs into a single
                          JSON file. Link is valid for 7 days.
                        </p>
                        <button
                          onClick={requestExport}
                          disabled={exporting}
                          className="px-4 py-2.5 rounded-full bg-white text-linear-black text-xs font-semibold hover:bg-white/90 transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                          {exporting ? "Building export..." : "Request export"}
                        </button>
                        {exportStatus && <p className="text-xs text-white/50 mt-3">{exportStatus}</p>}
                        {exportDownloadUrl && (
                          <a href={exportDownloadUrl} className="text-xs text-linear-indigo hover:underline mt-2 inline-block">
                            Download JSON &darr;
                          </a>
                        )}
                      </CardContent>
                    </Card>

                    <Card variant="danger">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle>Delete account</CardTitle>
                            <CardDescription>Permanently remove your data.</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-white/50 mb-4">
                          Your PII is anonymized immediately. After a 7-day grace period, all calls, comments, and team
                          memberships are permanently deleted.
                        </p>
                        <button
                          onClick={requestDelete}
                          disabled={deleting}
                          className={`px-4 py-2.5 rounded-full text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2 ${
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
                      </CardContent>
                    </Card>
                  </div>
                </Section>
              </>
            )}

            {(tab === "general" || !["workspace", "integrations", "api-keys", "security"].includes(tab)) && (
              <>
                {/* Profile */}
                <Section title="Profile">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <Avatar src={user?.imageUrl} name={user?.fullName} size="lg" />
                        <div>
                          <div className="text-lg font-medium text-white">{user?.fullName || "Your account"}</div>
                          <div className="text-sm text-white/40">{user?.primaryEmailAddress?.emailAddress}</div>
                        </div>
                        <a
                          href="/user-profile"
                          className="ml-auto px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium hover:bg-white/10 hover:text-white transition flex items-center gap-2"
                        >
                          Edit profile <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm text-white/60 mb-2">Display name</label>
                          <input
                            type="text"
                            defaultValue={user?.fullName || ""}
                            readOnly
                            className="w-full px-3 py-2 rounded-xl bg-linear-black border border-linear-secondary text-white text-sm"
                          />
                          <p className="text-xs text-white/30 mt-2">Managed by Clerk. Click Edit profile to update.</p>
                        </div>
                        <div>
                          <label className="block text-sm text-white/60 mb-2">Email</label>
                          <input
                            type="email"
                            defaultValue={user?.primaryEmailAddress?.emailAddress || ""}
                            readOnly
                            className="w-full px-3 py-2 rounded-xl bg-linear-black border border-linear-secondary text-white text-sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Section>

                {/* Plan & usage */}
                <Section title="Plan & usage" description="Your current plan and monthly consumption.">
                  <Card variant={billing?.plan === "free" ? "default" : "accent"}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                          <Crown className="w-4 h-4 text-linear-indigo" />
                        </div>
                        <div>
                          <CardTitle>{plan.name} plan</CardTitle>
                          <CardDescription>
                            {billing?.trialEndsAt
                              ? `Trial ends ${new Date(billing.trialEndsAt).toLocaleDateString()}`
                              : billing?.cancellationEffectiveDate
                                ? `Cancels ${new Date(billing.cancellationEffectiveDate).toLocaleDateString()}`
                                : "Manage your subscription and limits"}
                          </CardDescription>
                        </div>
                      </div>
                      <a
                        href="/pricing"
                        className="px-4 py-2 rounded-full bg-[#F26522] hover:bg-[#e05a1a] text-white text-xs font-semibold transition"
                      >
                        Upgrade
                      </a>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {billingLoading ? (
                        <div className="flex items-center gap-2 text-sm text-white/40">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading usage…
                        </div>
                      ) : billing ? (
                        <>
                          <ProgressBar
                            label="Call uploads"
                            sublabel={`${billing.usage} / ${billing.limit}${typeof billing.limit === "number" ? "" : ""}`}
                            value={billing.usage}
                            max={typeof billing.limit === "number" ? billing.limit : 100}
                            color={usagePct > 90 ? "red" : usagePct > 70 ? "amber" : "indigo"}
                          />
                          <ProgressBar
                            label="Transcription minutes"
                            sublabel={`${billing.minuteUsage} / ${billing.minuteLimit}`}
                            value={billing.minuteUsage}
                            max={typeof billing.minuteLimit === "number" ? billing.minuteLimit : 100}
                            color={minutePct > 90 ? "red" : minutePct > 70 ? "amber" : "indigo"}
                          />
                          <ProgressBar
                            label="Team members"
                            sublabel={`${billing.teamMemberCount} / ${billing.teamMemberLimit}`}
                            value={billing.teamMemberCount}
                            max={typeof billing.teamMemberLimit === "number" ? billing.teamMemberLimit : 100}
                            color={teamPct > 90 ? "red" : teamPct > 70 ? "amber" : "indigo"}
                          />
                        </>
                      ) : (
                        <p className="text-sm text-white/40">Unable to load usage.</p>
                      )}
                    </CardContent>
                    <CardFooter className="border-t border-white/5 pt-4 mt-2">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(plan.features).slice(0, 8).map(([key, val]) => (
                          <Badge key={key} variant={val ? "info" : "outline"}>
                            {val ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {formatFeatureKey(key)}
                          </Badge>
                        ))}
                      </div>
                    </CardFooter>
                  </Card>
                </Section>

                {/* Preferences */}
                <Section title="Preferences" description="Customize how Gauge works for you.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Sliders className="w-4 h-4 text-linear-indigo" />
                          <CardTitle>Transcription</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm text-white/60 mb-2">Default language</label>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-linear-black border border-linear-secondary text-white text-sm"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="pt">Portuguese</option>
                            <option value="it">Italian</option>
                            <option value="nl">Dutch</option>
                            <option value="pl">Polish</option>
                            <option value="sv">Swedish</option>
                            <option value="da">Danish</option>
                            <option value="fi">Finnish</option>
                            <option value="hi">Hindi</option>
                            <option value="auto">Auto-detect</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-white/60 mb-2">Summary tone</label>
                          <select
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-linear-black border border-linear-secondary text-white text-sm"
                          >
                            <option value="concise">Concise</option>
                            <option value="balanced">Balanced</option>
                            <option value="detailed">Detailed</option>
                            <option value="executive">Executive summary</option>
                          </select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Bell className="w-4 h-4 text-linear-indigo" />
                          <CardTitle>Notifications</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <Toggle
                          checked={emailDigest}
                          onChange={setEmailDigest}
                          label="Weekly digest"
                          description="A summary of your calls and action items every Monday."
                        />
                        <Toggle
                          checked={actionReminders}
                          onChange={setActionReminders}
                          label="Action item reminders"
                          description="Remind me about overdue tasks."
                        />
                        <Toggle
                          checked={teamAlerts}
                          onChange={setTeamAlerts}
                          label="Team alerts"
                          description="Notify when teammates mention me or assign calls."
                        />
                      </CardContent>
                    </Card>
                  </div>
                </Section>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
    </>
  );
}

function formatFeatureKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/crm/i, "CRM")
    .replace(/Ai\b/i, "AI")
    .replace(/Sso/i, "SSO")
    .replace(/Api/i, "API");
}
