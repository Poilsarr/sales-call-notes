"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Palette, Save, Loader2 } from "lucide-react";

/**
 * Team branding settings card (Level 5.1).
 *
 * Server enforces ADMIN/OWNER on PUT /api/team/branding. The form
 * is always interactive; a 403 surfaces as a toast so we never
 * have to leak role checks into client bundle.
 */
export default function TeamBrandingForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandColor, setBrandColor] = useState("#5b21b6");
  const [logoUrl, setLogoUrl] = useState("");
  const [hasTeam, setHasTeam] = useState(false);

  useEffect(() => {
    fetch("/api/team/branding")
      .then((r) => r.json())
      .then((d) => {
        setHasTeam(Boolean(d?.teamId));
        if (d?.brandColor) setBrandColor(d.brandColor);
        if (d?.logoUrl) setLogoUrl(d.logoUrl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/team/branding", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandColor, logoUrl: logoUrl || null }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err?.error || "Save failed");
        return;
      }
      const data = await r.json();
      setBrandColor(data.brandColor ?? brandColor);
      setLogoUrl(data.logoUrl ?? "");
      toast.success("Branding updated");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-linear-surface border border-linear-secondary flex items-center gap-2 text-white/50">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading branding…
      </div>
    );
  }

  if (!hasTeam) {
    return (
      <div className="p-6 rounded-2xl bg-linear-surface border border-linear-secondary">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="w-5 h-5 text-linear-indigo" />
          <h2 className="text-lg font-medium">Team branding</h2>
        </div>
        <p className="text-sm text-white/50">
          Join or create a team to set a custom brand color and logo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="p-6 rounded-2xl bg-linear-surface border border-linear-secondary">
      <div className="flex items-center gap-3 mb-4">
        <Palette className="w-5 h-5 text-linear-indigo" />
        <h2 className="text-lg font-medium">Team branding</h2>
        <span className="text-xs text-white/40 ml-auto">admin / owner only</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-sm text-white/60">Brand color</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-12 h-10 rounded border border-linear-secondary bg-transparent"
              aria-label="Brand color picker"
            />
            <input
              type="text"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              pattern="^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"
              className="flex-1 px-3 py-2 rounded-lg bg-linear-black border border-linear-secondary text-white text-sm font-mono"
              placeholder="#5b21b6"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/60">Logo URL (https)</span>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            pattern="https://.*"
            placeholder="https://cdn.example.com/logo.png"
            className="w-full px-3 py-2 rounded-lg bg-linear-black border border-linear-secondary text-white text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-linear-indigo text-white text-sm font-medium flex items-center gap-2 disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save branding
        </button>
        <div
          className="flex items-center gap-2 text-xs text-white/40"
          aria-label="Live preview"
        >
          <span>preview:</span>
          <span
            className="inline-block w-5 h-5 rounded"
            style={{ background: brandColor }}
          />
        </div>
      </div>
    </form>
  );
}