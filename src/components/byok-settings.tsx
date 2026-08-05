"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, Save, Trash2, Check, Crown } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * BYOK (bring-your-own-key) settings UI.
 *
 * Pro+ users can plug in their own OpenAI / Groq API keys so their
 * calls bill against their key instead of Gauge's shared pool. Keys are
 * encrypted at rest server-side (AES-256-GCM, BYOK_MASTER_KEY) — we
 * never store or display the plaintext.
 */

type ByokStatus = {
  allowed: boolean;
  plan: string;
  upgradeUrl: string | null;
  openaiConfigured: boolean;
  groqConfigured: boolean;
};

const ROWS = [
  {
    id: "openai" as const,
    label: "OpenAI",
    placeholder: "sk-…",
    hint: "Used for whisper-1 transcription, GPT analysis, and embeddings.",
  },
  {
    id: "groq" as const,
    label: "Groq",
    placeholder: "gsk_…",
    hint: "Used for whisper-large-v3 transcription and llama analysis. Fast + cheap.",
  },
];

export default function ByokSettings() {
  const [status, setStatus] = useState<ByokStatus | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<{ openai: string; groq: string }>({ openai: "", groq: "" });
  const [saving, setSaving] = useState<null | "openai" | "groq">(null);
  const [removing, setRemoving] = useState<null | "openai" | "groq">(null);

  async function refresh() {
    try {
      const r = await fetch("/api/settings/byok", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load");
      setStatus(await r.json());
      setLoadError(false);
    } catch (err) {
      console.error(err);
      setLoadError(true);
      toast.error("Could not load BYOK status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save(id: "openai" | "groq") {
    const key = values[id].trim();
    if (!key) {
      toast.error(`Paste your ${id === "openai" ? "OpenAI" : "Groq"} API key first`);
      return;
    }
    setSaving(id);
    try {
      const r = await fetch("/api/settings/byok", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [`${id}Key`]: key }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(body?.error || "Failed to save key");
        return;
      }
      toast.success(`${id === "openai" ? "OpenAI" : "Groq"} key saved — your calls will use it now`);
      setValues((v) => ({ ...v, [id]: "" }));
      await refresh();
    } finally {
      setSaving(null);
    }
  }

  async function remove(id: "openai" | "groq") {
    if (!confirm(`Remove your ${id === "openai" ? "OpenAI" : "Groq"} key? Calls will fall back to Gauge's shared keys.`)) {
      return;
    }
    setRemoving(id);
    try {
      const r = await fetch("/api/settings/byok", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [`${id}Key`]: "" }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        toast.error(body?.error || "Failed to remove key");
        return;
      }
      toast.success("Key removed");
      await refresh();
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-2 text-white/50" role="status">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading BYOK status…
        </CardContent>
      </Card>
    );
  }

  if (loadError || !status) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-white/60">
          Could not load BYOK status. <button type="button" onClick={refresh} className="underline underline-offset-2 hover:text-white">Try again</button>
        </CardContent>
      </Card>
    );
  }

  if (!status.allowed) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-[#F26522]" />
            <div>
              <CardTitle>Bring your own AI keys</CardTitle>
              <CardDescription>
                A Pro feature. Use your own OpenAI / Groq keys and stop sharing Gauge&apos;s shared rate pool.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <a
            href={status?.upgradeUrl || "/pricing"}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-linear-indigo text-white text-sm font-medium hover:bg-linear-indigo/80 transition"
          >
            <Crown className="w-4 h-4" /> Upgrade to use this
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-linear-indigo" />
          <div>
            <CardTitle>Bring your own AI keys</CardTitle>
            <CardDescription>
              Your calls bill against your key, not Gauge&apos;s pool. Encrypted at rest — we never store or display the plaintext.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ROWS.map((row) => {
          const configured = row.id === "openai" ? status.openaiConfigured : status.groqConfigured;
          const busy = saving === row.id || removing === row.id;
          return (
            <div key={row.id} className="p-4 rounded-xl bg-linear-black border border-linear-secondary space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label htmlFor={`byok-${row.id}-key`} className="text-sm font-medium text-white">
                    {row.label}
                  </label>
                  {configured ? (
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                      Not set — uses Gauge keys
                    </span>
                  )}
                </div>
                {configured && (
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    disabled={busy}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-40 transition focus-visible:outline-2 focus-visible:outline-linear-indigo"
                    aria-label={`Remove ${row.label} key`}
                  >
                    {removing === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <p id={`byok-${row.id}-hint`} className="text-xs text-white/60">{row.hint}</p>
              <div className="flex gap-2">
                <input
                  id={`byok-${row.id}-key`}
                  type="password"
                  value={values[row.id]}
                  onChange={(e) => setValues((v) => ({ ...v, [row.id]: e.target.value }))}
                  placeholder={row.placeholder}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby={`byok-${row.id}-hint`}
                  className="flex-1 px-3 py-2 rounded-xl bg-linear-black border border-linear-secondary text-white text-sm font-mono placeholder:text-white/50 focus-visible:outline-2 focus-visible:outline-linear-indigo"
                />
                <button
                  type="button"
                  onClick={() => save(row.id)}
                  disabled={busy || !values[row.id].trim()}
                  className="px-4 py-2 rounded-full bg-linear-indigo text-white text-sm font-medium flex items-center gap-2 shrink-0 disabled:opacity-40 hover:bg-linear-indigo/80 transition focus-visible:outline-2 focus-visible:outline-linear-indigo"
                >
                  {saving === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          );
        })}
        <p className="text-xs text-white/60">
          Overwriting a key replaces it. Saving a Groq key routes transcription to whisper-large-v3 (free tier) automatically.
        </p>
      </CardContent>
    </Card>
  );
}
