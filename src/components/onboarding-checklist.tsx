"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Check, X, Mic, FileText, Plug, Users, Sparkles } from "lucide-react";

type ProviderStatus = {
  connected: boolean;
  enabled: boolean;
  syncedAt: string | null;
  configured: boolean;
  error?: string;
};

type ChecklistItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  autoCheck?: boolean;
};

const STORAGE_KEY = "gauge-onboarding-checklist";

export default function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(false);
  const [manualState, setManualState] = useState<Record<string, boolean>>({});
  const [hasCall, setHasCall] = useState(false);
  const [hasIntegration, setHasIntegration] = useState(false);
  const [hasTeammate, setHasTeammate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load manual state and dismissed state from localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setManualState(parsed.items ?? {});
        setDismissed(parsed.dismissed ?? false);
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // Persist state whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items: manualState, dismissed })
      );
    } catch {
      // ignore
    }
  }, [manualState, dismissed]);

  // Auto-detect server-side milestones.
  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, integrationsRes, teamRes] = await Promise.all([
          fetch("/api/analytics?days=365"),
          fetch("/api/integrations"),
          fetch("/api/team"),
        ]);

        if (analyticsRes.ok) {
          const analytics = await analyticsRes.json();
          setHasCall((analytics.totalCalls ?? 0) > 0);
        }

        if (integrationsRes.ok) {
          const integrations = await integrationsRes.json();
          const states: Record<string, ProviderStatus> = integrations.integrations ?? {};
          setHasIntegration(Object.values(states).some((s) => s.connected && s.enabled));
        }

        if (teamRes.ok) {
          const team = await teamRes.json();
          setHasTeammate((team.members?.length ?? 1) > 1);
        }
      } catch {
        // fail silently — checklist should never block the app
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const toggleItem = useCallback((id: string) => {
    setManualState((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const items: ChecklistItem[] = [
    {
      id: "first-call",
      icon: <Mic size={16} />,
      label: "Upload or record your first call",
      description: "Get your first transcript in under a minute.",
      href: "/app/record",
      autoCheck: hasCall,
    },
    {
      id: "view-transcript",
      icon: <FileText size={16} />,
      label: "View a transcript",
      description: "Open a call to see the summary and action items.",
      href: "/app/calls",
    },
    {
      id: "connect-integration",
      icon: <Plug size={16} />,
      label: "Connect an integration",
      description: "Sync notes to HubSpot, Salesforce, or Slack.",
      href: "/integrations",
      autoCheck: hasIntegration,
    },
    {
      id: "invite-teammate",
      icon: <Users size={16} />,
      label: "Invite a teammate",
      description: "Share calls and analytics with your team.",
      href: "/team",
      autoCheck: hasTeammate,
    },
  ];

  const completedCount = items.filter(
    (item) => (item.autoCheck ?? false) || manualState[item.id]
  ).length;
  const total = items.length;
  const allDone = completedCount === total;
  const progress = Math.round((completedCount / total) * 100);

  // Collapse when everything is done.
  useEffect(() => {
    if (allDone && !dismissed) {
      const timer = setTimeout(() => setDismissed(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [allDone, dismissed]);

  if (dismissed) return null;
  if (loading) return null;

  return (
    <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="doppel-outer-dark overflow-hidden">
        <div className="doppel-inner-dark p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-medium text-[#F26522] mb-1.5">
                <Sparkles size={12} /> Get started
              </div>
              <h3 className="text-[15px] font-semibold text-white">Finish your setup</h3>
              <p className="text-[12px] text-zinc-400 mt-0.5">
                {allDone
                  ? "You're all set — happy selling!"
                  : `${completedCount} of ${total} complete`}
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 text-zinc-500 hover:text-white transition"
              aria-label="Dismiss checklist"
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-[#F26522] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => {
              const completed = (item.autoCheck ?? false) || manualState[item.id];
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    completed
                      ? "bg-zinc-900/40 border-zinc-800/60"
                      : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      completed
                        ? "bg-[#F26522] border-[#F26522]"
                        : "border-zinc-600 hover:border-zinc-500"
                    }`}
                    aria-label={completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {completed && <Check size={12} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={item.href}
                      className="block text-[13px] font-medium text-white hover:text-[#F26522] transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {item.icon}
                        {item.label}
                      </span>
                    </Link>
                    <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
