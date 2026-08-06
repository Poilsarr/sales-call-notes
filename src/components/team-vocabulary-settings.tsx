"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Entry {
  id: string;
  term: string;
  definition: string;
}

const TERM_MAX = 100;
const DEFINITION_MAX = 500;

export default function TeamVocabularySettings() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [hasTeam, setHasTeam] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/team/vocabulary")
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d?.entries)) return;
        setEntries(d.entries);
        setIsAdmin(d?.role === "ADMIN" || d?.role === "OWNER");
        setHasTeam(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function addTerm(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/team/vocabulary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ term, definition }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 403) setIsAdmin(false);
        toast.error(data?.error || "Failed to add term");
        return;
      }
      setEntries((prev) =>
        [...prev, data.entry].sort((a, b) => a.term.localeCompare(b.term)),
      );
      setTerm("");
      setDefinition("");
      toast.success("Term added — it will apply to the next call analysis");
    } finally {
      setSaving(false);
    }
  }

  async function removeTerm(id: string) {
    const r = await fetch(`/api/team/vocabulary/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      toast.error(data?.error || "Failed to remove term");
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Term removed");
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading vocabulary…
        </CardContent>
      </Card>
    );
  }

  if (!hasTeam) {
    return (
      <Card>
        <CardContent className="p-6 text-gray-500">
          Create or join a team to manage a shared glossary — your team&apos;s
          terms teach the analyst the words you use internally.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-indigo/10 flex items-center justify-center text-linear-indigo">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-white">Team vocabulary</CardTitle>
            <CardDescription className="text-white/40">
              Teach Gauge your internal terms (product names, deal stages, competitors).
              Applied to every new call analysis in this team.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={addTerm} className="space-y-3">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            maxLength={TERM_MAX}
            placeholder="Term (e.g. Lighthouse deal)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-linear-indigo"
          />
          <textarea
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            maxLength={DEFINITION_MAX}
            rows={2}
            placeholder="What it means (e.g. our $50k+ enterprise expansion tier)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-linear-indigo resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/30">
              {term.length}/{TERM_MAX} · {definition.length}/{DEFINITION_MAX}
            </span>
            <button
              type="submit"
              disabled={saving || !term.trim() || !definition.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-indigo px-4 py-2 text-sm font-medium text-white hover:bg-linear-indigo/90 disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add term
            </button>
          </div>
        </form>

        {entries.length === 0 ? (
          <p className="text-sm text-white/40">
            No terms yet. Add your first term to tune how calls are analyzed.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {entries.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{e.term}</p>
                  <p className="text-sm text-white/50">{e.definition}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => removeTerm(e.id)}
                    aria-label={`Remove term ${e.term}`}
                    className="shrink-0 rounded-lg p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-white/30">
          Admins can add and remove terms. The glossary is capped at 200 terms; the
          first 50 (alphabetical) are included in each analysis.
        </p>
      </CardContent>
    </Card>
  );
}
