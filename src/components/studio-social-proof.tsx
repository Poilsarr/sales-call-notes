"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, Star } from "lucide-react";


const EXTRA_REVIEWS = [
  {
    initials: "JM",
    name: "Jamie McKenzie",
    role: "VP Sales · Momentum.io",
    quote: "Gauge caught 3 competitor mentions I completely missed. Slack ping came through in seconds. Closed the deal same week.",
    rating: 5,
    accent: "#10b981",
  },
  {
    initials: "DS",
    name: "Deepa Sharma",
    role: "RevOps Lead · CloudAxis",
    quote: "Our HubSpot data went from 40% complete to 98% in 2 weeks. Reps actually love it — no extra work for them.",
    rating: 5,
    accent: "#6366f1",
  },
];

const COMMUNITIES = [
  { name: "Modern Sales Pros", style: "font-serif italic font-bold text-[17px] text-gray-900" },
  { name: "PAVILION", style: "font-sans font-black tracking-[0.2em] text-[13px] text-gray-800 uppercase" },
  { name: "RevGenius", style: "font-sans font-bold tracking-widest text-[13px] text-gray-700 uppercase" },
  { name: "HubSpot Certified", style: "font-mono font-semibold text-[12px] text-[#FF7A59]" },
];

export function StudioSocialProof() {
  return (
    <section
      data-track-section="social-proof-studio"
      aria-label="Customer Social Proof"
      className="py-16 sm:py-20 lg:py-24 bg-white border-b border-black/[0.05] overflow-hidden"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10">

        {/* ── Section Header ── */}
        <div className="max-w-2xl mb-14 sm:mb-18">
          <p className="text-[12px] font-mono uppercase tracking-[0.18em] text-[#F26522] font-semibold mb-3">
            Real Revenue Teams
          </p>
          <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-medium tracking-[-0.03em] text-gray-900 leading-[1.05] mb-4 text-balance">
            Trusted by teams,<br />loved by sales reps
          </h2>
          <p className="text-[16px] text-gray-500 leading-relaxed max-w-lg">
            Real revenue teams closing more deals — without a single recording bot.
          </p>
        </div>

        {/* ── Main Bento Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch mb-5">

          {/* ── LEFT HERO TESTIMONIAL ── */}
          <div
            className="lg:col-span-7 rounded-2xl p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden min-h-[440px]"
            style={{
              background: "linear-gradient(145deg, #0f0f0f 0%, #1a1a1a 40%, #111 70%, #0d0d0d 100%)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {/* Background texture glow */}
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  "radial-gradient(ellipse at 20% 80%, #F26522 0%, transparent 55%), radial-gradient(ellipse at 80% 10%, #10b981 0%, transparent 50%)",
              }}
            />

            {/* Top row: avatar + stars */}
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar with orange ring */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-black text-base text-white shrink-0"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, #ff9a5c, #F26522 55%, #b84d12 100%)",
                    boxShadow: "0 0 0 3px rgba(242,101,34,0.35), 0 6px 20px rgba(242,101,34,0.3)",
                  }}
                >
                  AR
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white leading-tight">Alex Rivera</p>
                  <p className="text-[13px] text-white/55 mt-0.5">Head of Sales · HyperScale</p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5 shrink-0 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="text-amber-400" fill="currentColor" />
                ))}
              </div>
            </div>

            {/* Quote */}
            <div className="relative z-10 my-8 flex-1 flex flex-col justify-center">
              {/* Decorative quote mark */}
              <div
                className="text-[96px] leading-none font-serif text-white/10 select-none mb-[-28px] ml-[-6px]"
                aria-hidden
              >
                &ldquo;
              </div>
              <blockquote className="text-[20px] sm:text-[24px] font-medium leading-[1.35] text-white tracking-tight text-balance relative z-10">
                It&apos;s an incredible app. The Chrome extension alone{" "}
                <span className="text-[#F26522]">won us 3 deals against Gong</span> last month —
                because the client never had to let an awkward bot into our call.
              </blockquote>
            </div>

            {/* Bottom stats strip */}
            <div className="relative z-10">
              {/* Divider */}
              <div className="h-px w-full bg-white/10 mb-4" />
              <div className="flex items-center justify-between text-[12px] font-mono">
                <span className="text-white/45">Verified Customer · 42 Sales Reps</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <ShieldCheck size={13} />
                  Zero Bots Used
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-5 flex flex-col gap-5">


            {/* ─ Ecosystem / communities logos card ─ */}
            <div
              className="rounded-2xl p-6 sm:p-7 border border-black/[0.06] flex-1 flex flex-col justify-between"
              style={{
                background: "linear-gradient(135deg, #fafafa 0%, #f5f5f7 100%)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)",
              }}
            >
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-400 font-semibold mb-5 block">
                Ecosystem & Sales Communities
              </span>

              {/* Logo grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 items-center flex-1">
                {COMMUNITIES.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-center py-3 px-4 rounded-xl bg-white border border-black/[0.06] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-default"
                  >
                    <span className={c.style}>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ─ Zero-Bot Standard card ─ */}
            <div
              className="rounded-2xl p-6 sm:p-7 border border-[#F26522]/20 flex flex-col justify-between overflow-hidden relative"
              style={{
                background: "linear-gradient(135deg, #fff8f4 0%, #fff3ec 100%)",
              }}
            >
              {/* Background glow */}
              <div
                className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20"
                style={{ background: "#F26522", filter: "blur(28px)" }}
              />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.16em] text-[#F26522] font-bold bg-orange-100 border border-orange-200/60 px-2.5 py-1 rounded-full mb-3">
                  <ShieldCheck size={11} />
                  Zero-Bot Standard
                </span>
                <h3 className="text-[19px] sm:text-[21px] font-bold text-gray-900 tracking-tight mb-2 leading-snug">
                  No bots. No awkward<br />participant lists.
                </h3>
                <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
                  Gauge captures audio directly in your browser tab.
                  Zero bots join the call. Zero prospect friction. Zero IT bans.
                </p>
              </div>
              <Link
                href="/security"
                className="relative z-10 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#F26522] hover:underline"
              >
                Read our security architecture
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Secondary mini testimonials row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {EXTRA_REVIEWS.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl p-6 bg-[#F8F9FA] border border-black/[0.06] hover:border-black/[0.12] hover:bg-white hover:shadow-sm transition-all flex flex-col gap-4"
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {[...Array(r.rating)].map((_, i) => (
                  <Star key={i} size={12} className="text-amber-400" fill="currentColor" />
                ))}
              </div>

              <blockquote className="text-[14px] text-gray-700 leading-relaxed flex-1">
                &ldquo;{r.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3 pt-3 border-t border-black/[0.06]">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), transparent 50%), ${r.accent}`,
                  }}
                >
                  {r.initials}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 leading-tight">{r.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
