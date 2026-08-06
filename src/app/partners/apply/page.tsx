"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import GaugeLogo from "@/components/gauge-logo";

const AUDIENCES = [
  { value: "sales-coach", label: "Sales coach" },
  { value: "newsletter", label: "Newsletter writer" },
  { value: "community", label: "Community builder" },
  { value: "agency", label: "Agency" },
  { value: "consultant", label: "RevOps consultant" },
  { value: "content-creator", label: "Content creator" },
  { value: "other", label: "Other" },
];

const REACHES = [
  { value: "<1k", label: "Under 1k" },
  { value: "1k-10k", label: "1k – 10k" },
  { value: "10k-50k", label: "10k – 50k" },
  { value: "50k+", label: "50k+" },
];

export default function PartnerApplyPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    audience: "",
    reach: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <main id="main" className="min-h-screen bg-[#0a0a0b] text-white">
      <header className="border-b border-white/5 sticky top-0 bg-[#0a0a0b]/90 backdrop-blur z-10">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <GaugeLogo size={26} dark />
            <span className="text-[14px] font-semibold tracking-tight">Gauge</span>
          </Link>
          <Link href="/partners" className="text-[13px] text-white/60 hover:text-white transition-colors">
            ← Back to Partners
          </Link>
        </div>
      </header>

      <section className="max-w-[640px] mx-auto px-5 sm:px-8 py-16 sm:py-24">
        {status === "done" ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight mb-3">Application received</h1>
            <p className="text-[14px] text-white/55 leading-relaxed max-w-sm mx-auto">
              Thanks for applying to the Gauge partner program. We review every application
              within 24 hours and will reach out at the email you provided.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-8 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2.5 font-medium"
            >
              <span>Back to home</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#F26522] mb-4">
              Partner Application
            </p>
            <h1 className="text-[clamp(28px,4vw,40px)] font-semibold tracking-tight leading-[1.05] mb-3">
              Become a Gauge partner.
            </h1>
            <p className="text-[14px] text-white/55 leading-relaxed mb-10">
              Earn 30% recurring commission on every referral. Tell us a bit about you and we&apos;ll
              get you set up within 24 hours.
            </p>

            <form onSubmit={submit} className="space-y-6">
              <div>
                <label className="block text-[13px] font-medium text-white/80 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#F26522] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-white/80 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#F26522] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-white/80 mb-2">
                  What best describes you?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AUDIENCES.map((a) => (
                    <button
                      type="button"
                      key={a.value}
                      onClick={() => update("audience", a.value)}
                      className={`px-3 py-2.5 rounded-xl text-[12.5px] border transition-colors ${
                        form.audience === a.value
                          ? "border-[#F26522] bg-[#F26522]/10 text-white"
                          : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-white/80 mb-2">
                  Audience reach
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REACHES.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => update("reach", r.value)}
                      className={`px-3 py-2.5 rounded-xl text-[12.5px] border transition-colors ${
                        form.reach === r.value
                          ? "border-[#F26522] bg-[#F26522]/10 text-white"
                          : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-white/80 mb-2">
                  Anything else? <span className="text-white/40">(optional)</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  rows={3}
                  placeholder="How do you plan to refer Gauge?"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#F26522] transition-colors resize-none"
                />
              </div>

              {status === "error" && (
                <p className="text-[13px] text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] rounded-full py-3.5 font-medium transition-colors"
              >
                {status === "submitting" ? "Submitting…" : "Submit application"}
                {status !== "submitting" && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
