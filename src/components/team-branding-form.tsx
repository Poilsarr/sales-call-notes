"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Palette, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
      <Card>
        <CardContent className="p-6 flex items-center gap-2 text-white/50">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading branding…
        </CardContent>
      </Card>
    );
  }

  if (!hasTeam) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-linear-indigo" />
            <CardTitle>Team branding</CardTitle>
          </div>
          <CardDescription>Join or create a team to set a custom brand color and logo.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={save}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-linear-indigo" />
            <div>
              <CardTitle>Team branding</CardTitle>
              <CardDescription>Customize how your workspace looks in shared exports.</CardDescription>
            </div>
          </div>
          <span className="text-xs text-white/40">Admin / owner only</span>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="space-y-2">
              <span className="text-sm text-white/60">Brand color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-12 h-10 rounded-lg border border-linear-secondary bg-transparent cursor-pointer"
                  aria-label="Brand color picker"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  pattern="^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"
                  className="flex-1 px-3 py-2 rounded-xl bg-linear-black border border-linear-secondary text-white text-sm font-mono"
                  placeholder="#5b21b6"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-white/60">Logo URL</span>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                pattern="https://.*"
                placeholder="https://cdn.example.com/logo.png"
                className="w-full px-3 py-2 rounded-xl bg-linear-black border border-linear-secondary text-white text-sm"
              />
            </label>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-full bg-linear-indigo text-white text-sm font-medium flex items-center gap-2 disabled:opacity-40 hover:bg-linear-indigo/80 transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save branding
            </button>
            <div className="flex items-center gap-2 text-xs text-white/40" aria-label="Live preview">
              <span>Preview:</span>
              <span className="inline-block w-5 h-5 rounded" style={{ background: brandColor }} />
            </div>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
