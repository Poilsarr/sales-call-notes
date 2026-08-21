"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Building2, Users, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import UpgradePrompt from "@/components/upgrade-prompt";
import { suggestCompanyFromEmail } from "@/lib/company-suggest";

interface CompetitorEntry {
  id: string;
  name: string;
}

const COMPANY_MAX = 120;
const COMPETITOR_MAX = 100;
const COMPETITOR_RE = /^[A-Za-z0-9][A-Za-z0-9 &.'-]{0,98}[A-Za-z0-9.]?$/;

function normalizeCompetitorName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\b(inc\.?|llc|ltd|corp\.?|co\.?|l\.?l\.?p\.?)\b\.?$/i, "")
    .replace(/[^a-z0-9 &.'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validateCompetitorName(name: string, existing: CompetitorEntry[]): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name is required";
  if (trimmed.length > COMPETITOR_MAX) return `Must be ${COMPETITOR_MAX} characters or fewer`;
  if (/[\r\n\x00-\x1f\x7f]/.test(name)) return "Invalid characters";
  if (!COMPETITOR_RE.test(trimmed)) return "Use letters, numbers, spaces, & . ' - only";
  const norm = normalizeCompetitorName(trimmed);
  if (!norm) return "Name is required";
  const dup = existing.some((e) => normalizeCompetitorName(e.name) === norm);
  if (dup) return "Already in watchlist";
  return null;
}

export default function CompanyCompetitorSettings() {
  const { user } = useUser();

  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingCompetitors, setLoadingCompetitors] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [originalCompanyName, setOriginalCompanyName] = useState<string | null>(null);
  const [entries, setEntries] = useState<CompetitorEntry[]>([]);
  const [isAdmin, setIsAdmin] = useState(true);
  const [hasTeam, setHasTeam] = useState(false);
  const [planLocked, setPlanLocked] = useState(false);
  const [planLimit, setPlanLimit] = useState<number>(20);
  const [billingLoaded, setBillingLoaded] = useState(false);

  const [newCompetitor, setNewCompetitor] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingCompetitor, setSavingCompetitor] = useState(false);
  const [competitorError, setCompetitorError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null;
  const suggestion = useMemo(() => suggestCompanyFromEmail(email), [email]);

  const showSuggestion = useMemo(() => {
    if (!suggestion) return false;
    if (dismissedSuggestion) return false;
    if (!companyName || companyName.trim() === "") return true;
    // hide if already matches suggestion (case-insensitive)
    if (companyName.trim().toLowerCase() === suggestion.toLowerCase()) return false;
    return true;
  }, [suggestion, companyName, dismissedSuggestion]);

  // Fetch billing to determine plan gate and limits
  useEffect(() => {
    fetch("/api/billing", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const plan = (d?.plan as string | undefined)?.toLowerCase() ?? "free";
        if (plan === "free") {
          setPlanLocked(true);
          setPlanLimit(0);
        } else if (plan === "pro") {
          setPlanLocked(false);
          setPlanLimit(20);
        } else {
          // business / enterprise
          setPlanLocked(false);
          setPlanLimit(100);
        }
      })
      .catch(() => {})
      .finally(() => setBillingLoaded(true));
  }, []);

  // Fetch company
  useEffect(() => {
    fetch("/api/company", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          // If 404 or 401, treat as no company yet
          return;
        }
        if (typeof d?.companyName === "string") {
          setCompanyName(d.companyName);
          setOriginalCompanyName(d.companyName);
        } else if (d?.companyName === null) {
          setCompanyName("");
          setOriginalCompanyName(null);
        }
        if (d?.role) {
          const role = String(d.role).toUpperCase();
          setIsAdmin(role === "ADMIN" || role === "OWNER");
          setHasTeam(true);
        } else if (d?.hasTeam === true || d?.teamId) {
          setHasTeam(true);
        }
        // Some implementations return role at top-level, others via separate endpoint
        if (d?.isAdmin === false) setIsAdmin(false);
      })
      .catch(() => {})
      .finally(() => setLoadingCompany(false));
  }, []);

  // Fetch competitors
  useEffect(() => {
    fetch("/api/competitors", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) return;
        if (Array.isArray(d?.entries)) {
          const list: CompetitorEntry[] = d.entries
            .filter((e: unknown): e is CompetitorEntry => typeof (e as CompetitorEntry)?.id === "string" && typeof (e as CompetitorEntry)?.name === "string")
            .sort((a: CompetitorEntry, b: CompetitorEntry) => a.name.localeCompare(b.name));
          setEntries(list);
        }
        if (d?.role) {
          const role = String(d.role).toUpperCase();
          setIsAdmin(role === "ADMIN" || role === "OWNER");
          setHasTeam(true);
        }
        if (d?.isAdmin === false) setIsAdmin(false);
        if (d?.hasTeam === true || d?.teamId) setHasTeam(true);
      })
      .catch(() => {})
      .finally(() => setLoadingCompetitors(false));
  }, []);

  const companyChanged = (companyName.trim() !== (originalCompanyName ?? "").trim()) && companyName.trim().length <= COMPANY_MAX;

  async function saveCompany(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = companyName.trim();
    if (trimmed.length > COMPANY_MAX) {
      setCompanyError(`Must be ${COMPANY_MAX} characters or fewer`);
      return;
    }
    if (trimmed && /[\r\n\x00-\x1f\x7f]/.test(trimmed)) {
      setCompanyError("Invalid characters");
      return;
    }
    setCompanyError(null);
    if (!isAdmin) {
      toast.error("Only Admins can update company name");
      return;
    }
    setSavingCompany(true);
    try {
      const r = await fetch("/api/company", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyName: trimmed || null }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 403 && data?.code === "PLAN_REQUIRED") {
          setPlanLocked(true);
          toast.error("Upgrade to Pro to set company name");
          return;
        }
        if (r.status === 403) setIsAdmin(false);
        toast.error(data?.error || "Failed to save company");
        return;
      }
      const saved = typeof data?.companyName === "string" ? data.companyName : trimmed || null;
      setOriginalCompanyName(saved);
      if (saved) setCompanyName(saved);
      toast.success("Company saved");
    } catch {
      toast.error("Network error saving company");
    } finally {
      setSavingCompany(false);
    }
  }

  function handleSuggestionClick() {
    if (!suggestion) return;
    setCompanyName(suggestion);
    setDismissedSuggestion(true);
  }

  async function addCompetitor(e: React.FormEvent) {
    e.preventDefault();
    const err = validateCompetitorName(newCompetitor, entries);
    if (err) {
      setCompetitorError(err);
      return;
    }
    if (!isAdmin) {
      toast.error("Only Admins can add competitors");
      return;
    }
    if (entries.length >= planLimit) {
      toast.error(`Watchlist capped at ${planLimit} entries`);
      return;
    }
    setCompetitorError(null);
    setSavingCompetitor(true);
    try {
      const r = await fetch("/api/competitors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newCompetitor.trim() }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 403 && data?.code === "PLAN_REQUIRED") {
          setPlanLocked(true);
          toast.error("Upgrade to Pro to add competitors");
          return;
        }
        if (r.status === 403) {
          // could be role gate
          if (data?.error?.toLowerCase?.().includes("forbidden") || data?.error?.toLowerCase?.().includes("admin")) {
            setIsAdmin(false);
          }
          toast.error(data?.error || "Forbidden — Admin only");
          return;
        }
        toast.error(data?.error || "Failed to add competitor");
        return;
      }
      const entry: CompetitorEntry = data.entry ?? data;
      if (entry?.id && entry?.name) {
        setEntries((prev) => [...prev, entry].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Competitor added");
      } else {
        // fallback: refetch
        setEntries((prev) => [...prev, { id: `tmp-${Date.now()}`, name: newCompetitor.trim() }].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setNewCompetitor("");
      setCompetitorError(null);
    } catch {
      toast.error("Network error");
    } finally {
      setSavingCompetitor(false);
    }
  }

  async function removeCompetitor(id: string) {
    if (!isAdmin) {
      toast.error("Only Admins can remove competitors");
      return;
    }
    setDeletingId(id);
    try {
      const r = await fetch(`/api/competitors/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        if (r.status === 404) {
          // treat as already deleted
          setEntries((prev) => prev.filter((e) => e.id !== id));
          return;
        }
        toast.error(data?.error || "Failed to remove");
        return;
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Removed");
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingId(null);
    }
  }

  const loading = loadingCompany || loadingCompetitors || !billingLoaded;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-2 text-white/50">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading company & competitors…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F26522]/10 flex items-center justify-center text-[#F26522]">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-white">Company & Competitors</CardTitle>
            <CardDescription className="text-white/40">
              Tell Gauge your company and rivals — intelligence prioritizes these. Your API keys don&apos;t contain your company name.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company name */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/80">Company name</label>
          <form onSubmit={saveCompany} className="space-y-2">
            <div className="flex gap-2">
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                maxLength={COMPANY_MAX}
                placeholder="e.g. Acme Corp"
                disabled={!isAdmin}
                title={!isAdmin ? "Only Admins can edit — ask your workspace owner." : undefined}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#F26522] disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={savingCompany || !isAdmin || !companyChanged}
                title={!isAdmin ? "Only Admins can edit — ask your workspace owner." : undefined}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] px-4 py-2 text-sm font-medium text-white hover:bg-[#e05a1a] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingCompany ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/30">
                {companyName.length}/{COMPANY_MAX}
              </span>
              {!isAdmin && (
                <span className="text-[11px] text-amber-400/80 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Only Admins can edit — ask your workspace owner.
                </span>
              )}
            </div>
            {companyError && <p className="text-xs text-red-400">{companyError}</p>}
          </form>

          {showSuggestion && suggestion && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Suggestion from your email:</span>
              <button
                type="button"
                onClick={handleSuggestionClick}
                disabled={!isAdmin}
                title={!isAdmin ? "Only Admins can edit — ask your workspace owner." : undefined}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Building2 className="w-3 h-3 text-[#F26522]" />
                {suggestion}
              </button>
              <button
                type="button"
                onClick={() => setDismissedSuggestion(true)}
                className="text-[11px] text-white/30 hover:text-white/60"
              >
                Dismiss
              </button>
            </div>
          )}
          <p className="text-[11px] text-white/30">We never auto-save this — click Apply chip to use it.</p>
        </div>

        <div className="h-px bg-white/5" />

        {/* Competitors */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#F26522]" />
            <span className="text-sm font-medium text-white/80">Watchlist</span>
            <span className="ml-auto text-xs text-white/40">
              {entries.length} / {planLimit === 0 ? "—" : planLimit}
            </span>
          </div>

          {planLocked ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <UpgradePrompt feature="competitive_intelligence" featureName="Competitive Intelligence" minimal />
              <p className="text-[11px] text-white/30 mt-2">Free plan — upgrade to track your rivals. Watchlist holds 20 (Pro) or 100 (Business).</p>
            </div>
          ) : (
            <>
              <form onSubmit={addCompetitor} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={newCompetitor}
                    onChange={(e) => {
                      setNewCompetitor(e.target.value);
                      if (competitorError) setCompetitorError(null);
                    }}
                    maxLength={COMPETITOR_MAX}
                    placeholder={isAdmin ? "Add competitor (e.g. Clio)" : "View only — Admin can add"}
                    disabled={!isAdmin || entries.length >= planLimit}
                    title={
                      !isAdmin
                        ? "Only Admins can edit — ask your workspace owner."
                        : entries.length >= planLimit
                        ? `Watchlist capped at ${planLimit}`
                        : undefined
                    }
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#F26522] disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={savingCompetitor || !isAdmin || !newCompetitor.trim() || entries.length >= planLimit}
                    title={!isAdmin ? "Only Admins can edit — ask your workspace owner." : undefined}
                    className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingCompetitor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add
                  </button>
                </div>
                {competitorError && <p className="text-xs text-red-400">{competitorError}</p>}
                {!isAdmin && (
                  <p className="text-[11px] text-amber-400/80 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Only Admins can edit — ask your workspace owner.
                  </p>
                )}
                {isAdmin && entries.length >= planLimit && (
                  <p className="text-[11px] text-amber-400/80">Watchlist capped at {planLimit} — delete one to add another.</p>
                )}
              </form>

              {entries.length === 0 ? (
                <p className="text-sm text-white/40">No rivals yet. Add your first competitor — intelligence will prioritize these.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {entries.map((e) => (
                    <span
                      key={e.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white"
                    >
                      {e.name}
                      {isAdmin ? (
                        <button
                          onClick={() => removeCompetitor(e.id)}
                          disabled={deletingId === e.id}
                          aria-label={`Remove ${e.name}`}
                          title={isAdmin ? `Remove ${e.name}` : "Only Admins can edit — ask your workspace owner."}
                          className="ml-1 p-0.5 rounded-full hover:bg-white/10 text-white/40 hover:text-red-400 disabled:opacity-40"
                        >
                          {deletingId === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      ) : (
                        <span title="Only Admins can edit — ask your workspace owner." className="ml-1 p-0.5 text-white/20">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-white/30">
                {planLimit === 100 ? "Business: up to 100 rivals (first 20 injected into analysis). Pro: 20." : `Capped at ${planLimit} rivals. First 20 injected into each analysis.`}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
