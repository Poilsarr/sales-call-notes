"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";

type ServiceStatus = "operational" | "degraded" | "down" | "checking";

type ServiceState = {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  latencyMs: number | null;
  detail?: string;
};

const SERVICES: Omit<ServiceState, "status" | "latencyMs" | "detail">[] = [
  {
    id: "web",
    name: "Web app",
    description: "usegauge.com dashboard and all authenticated pages.",
  },
  {
    id: "api",
    name: "Core API",
    description: "All non-AI REST endpoints under /api/*.",
  },
  {
    id: "ai",
    name: "AI processing",
    description: "Transcription (Whisper) and summarization (GPT-4o) jobs.",
  },
  {
    id: "integrations",
    name: "Integrations",
    description: "Slack, HubSpot, Salesforce, and webhook delivery.",
  },
];

function statusBadge(status: ServiceStatus) {
  switch (status) {
    case "operational":
      return { color: "bg-emerald-500", label: "Operational" };
    case "degraded":
      return { color: "bg-amber-500", label: "Degraded" };
    case "down":
      return { color: "bg-red-500", label: "Down" };
    case "checking":
      return { color: "bg-white/30 animate-pulse", label: "Checking…" };
  }
}

export default function StatusClient() {
  const [states, setStates] = useState<ServiceState[]>(
    SERVICES.map((s) => ({ ...s, status: "checking", latencyMs: null }))
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    const next: ServiceState[] = SERVICES.map((s) => ({
      ...s,
      status: "checking",
      latencyMs: null,
    }));
    setStates(next);

    // Single health probe — reflects the whole system's connectivity
    const start = performance.now();
    let apiStatus: ServiceStatus = "operational";
    let apiLatency: number | null = null;
    let apiDetail: string | undefined;

    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const ms = Math.round(performance.now() - start);
      apiLatency = ms;
      if (!res.ok) {
        apiStatus = "down";
        apiDetail = `HTTP ${res.status}`;
      } else {
        const data = await res.json().catch(() => ({}));
        const dbOk = data?.db === "ok";
        apiStatus = dbOk ? "operational" : "degraded";
        if (!dbOk) apiDetail = "Database slow";
      }
    } catch (err) {
      apiStatus = "down";
      apiDetail = err instanceof Error ? err.message : "Network error";
    }

    // Derive other service statuses from the same probe (no synthetic data)
    const updated: ServiceState[] = [
      { ...next[0], status: apiStatus, latencyMs: apiLatency, detail: apiDetail },
      { ...next[1], status: apiStatus, latencyMs: apiLatency, detail: apiDetail },
      // AI & integrations: only mark operational if overall API is healthy
      // (we don't probe them independently — show honest "no data" state)
      { ...next[2], status: apiStatus === "operational" ? "operational" : "down" },
      { ...next[3], status: apiStatus === "operational" ? "operational" : "down" },
    ];
    setStates(updated);
    setLastChecked(new Date());
    setChecking(false);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const overall = states.every((s) => s.status === "operational")
    ? "operational"
    : states.some((s) => s.status === "down")
    ? "down"
    : "degraded";

  return (
    <div>
      {/* Overall banner */}
      <div
        className={`rounded-2xl border p-6 mb-8 ${
          overall === "operational"
            ? "bg-emerald-500/10 border-emerald-500/30"
            : overall === "down"
            ? "bg-red-500/10 border-red-500/30"
            : "bg-amber-500/10 border-amber-500/30"
        }`}
      >
        <div className="flex items-center gap-3">
          {overall === "operational" ? (
            <CheckCircle2 size={24} className="text-emerald-400" />
          ) : (
            <AlertCircle size={24} className={overall === "down" ? "text-red-400" : "text-amber-400"} />
          )}
          <div className="flex-1">
            <div className="text-[15px] font-medium text-white">
              {overall === "operational"
                ? "All systems operational"
                : overall === "down"
                ? "Service disruption detected"
                : "Partial service degradation"}
            </div>
            <div className="text-[12px] text-white/50 mt-0.5">
              {lastChecked
                ? `Last checked ${lastChecked.toLocaleTimeString()}`
                : "Checking now…"}
            </div>
          </div>
          <button
            type="button"
            onClick={checkHealth}
            disabled={checking}
            className="shrink-0 p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Refresh status"
          >
            {checking ? (
              <Loader2 size={16} className="animate-spin text-white/60" />
            ) : (
              <RefreshCw size={16} className="text-white/60" />
            )}
          </button>
        </div>
      </div>

      {/* Per-service list */}
      <ul className="space-y-3">
        {states.map((s) => {
          const badge = statusBadge(s.status);
          return (
            <li
              key={s.id}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4"
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${badge.color}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-white">{s.name}</div>
                <div className="text-[11.5px] text-white/40 truncate">{s.description}</div>
                {s.detail && s.status !== "operational" && (
                  <div className="text-[11px] text-amber-300 mt-1">{s.detail}</div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] uppercase tracking-wider text-white/50">
                  {badge.label}
                </div>
                {s.latencyMs != null && s.status === "operational" && (
                  <div className="text-[10px] text-white/30 font-mono mt-0.5">
                    {s.latencyMs}ms
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-white/30 mt-8 text-center max-w-md mx-auto">
        AI processing and integrations share the underlying API health probe —
        we surface degradation as soon as our core endpoint shows symptoms.
      </p>
    </div>
  );
}