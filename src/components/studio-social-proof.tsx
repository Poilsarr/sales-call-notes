"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, Star } from "lucide-react";


const EXTRA_REVIEWS = [
  {
    plate: "/studio/gauge_review_jamie_studio.jpg",
    plateAlt: "Live call capture catching a competitor mention, an instant Slack ping in 3 seconds, and a deal closed the same week",
    initials: "JM",
    name: "Jamie McKenzie",
    role: "VP Sales · Momentum.io",
    quote: "Gauge caught 3 competitor mentions I completely missed. Slack ping came through in seconds. Closed the deal same week.",
    rating: 5,
    accent: "#10b981",
  },
  {
    plate: "/studio/gauge_review_deepa_studio.jpg",
    plateAlt: "HubSpot CRM data completeness rising from 40 to 98 percent in two weeks with zero manual feed",
    initials: "DS",
    name: "Deepa Sharma",
    role: "RevOps Lead · CloudAxis",
    quote: "Our HubSpot data went from 40% complete to 98% in 2 weeks. Reps actually love it — no extra work for them.",
    rating: 5,
    accent: "#6366f1",
  },
  {
    plate: "/studio/gauge_review_marcus_studio.jpg",
    plateAlt: "Follow-up email auto-drafted from the call and sent 8 minutes after hang-up — subject line reads Recap, rollout plan plus ROI numbers",
    initials: "MH",
    name: "Marcus Hale",
    role: "Account Executive · Brightwave",
    quote: "My follow-up went out 8 minutes after the call, drafted straight from the transcript. Prospects have noticed.",
    rating: 5,
    accent: "#F26522",
  },
  {
    plate: "/studio/gauge_review_priya_studio.jpg",
    plateAlt: "Today's call log showing Sarah Kim, Derek Owusu and Anne Voss — every conversation auto-logged to the CRM with zero keystrokes",
    initials: "PN",
    name: "Priya Natarajan",
    role: "SDR Manager · Leafline",
    quote: "My reps run 9 calls a day and every one lands in the CRM — logged, tagged, zero keystrokes. Our forecast finally tells the truth.",
    rating: 5,
    accent: "#8b5cf6",
  },
];

function SeriesCard({ r, idx }: { r: (typeof EXTRA_REVIEWS)[number]; idx: number }) {
  return (
    <div
      className="flex-shrink-0 w-[330px] sm:w-[440px] lg:w-[460px] mx-2.5 rounded-2xl p-5 sm:p-6 bg-[#F8F9FA] border border-black/[0.06] hover:border-black/[0.12] hover:bg-white hover:shadow-xl hover:shadow-black/[0.07] hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3.5 cursor-default"
    >
      {/* Studio plate: outcome scene */}
      <div className="relative rounded-xl overflow-hidden border border-black/[0.06] shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={r.plate}
          alt={r.plateAlt}
          className={`studio-float block w-full ${idx % 2 === 1 ? "studio-float-alt" : ""}`}
          loading="lazy"
        />
      </div>

      {/* Stars */}
      <div className="flex items-center gap-1 pt-1">
        {[...Array(r.rating)].map((_, si) => (
          <Star key={si} size={14} className="text-amber-400" fill="currentColor" />
        ))}
      </div>

      <blockquote className="text-[16px] text-gray-800 leading-[1.55] flex-1">
        &ldquo;{r.quote}&rdquo;
      </blockquote>

      <div className="flex items-center gap-3 pt-3.5 border-t border-black/[0.06]">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
          style={{
            background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), transparent 50%), ${r.accent}`,
          }}
        >
          {r.initials}
        </div>
        <div>
          <p className="text-[15.5px] font-semibold text-gray-900 leading-tight">{r.name}</p>
          <p className="text-[12.5px] text-gray-500 mt-0.5">{r.role}</p>
        </div>
      </div>
    </div>
  );
}

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
              <blockquote className="text-[21px] sm:text-[27px] font-medium leading-[1.32] text-white tracking-tight text-balance relative z-10">
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

              {/* Studio plate: community wordmarks orbiting the network core */}
              <div className="flex-1 flex items-center">
                <div className="w-full rounded-xl overflow-hidden border border-black/[0.06] shadow-sm transition-transform duration-500 ease-out hover:-translate-y-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/studio/gauge_communities_studio.jpg"
                    alt="3D render: community wordmarks — Modern Sales Pros, Pavilion, RevGenius, HubSpot Certified — orbiting a glowing network core"
                    className="studio-float block w-full"
                    loading="lazy"
                  />
                </div>
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

      </div>

      {/* ── Secondary testimonials: full-bleed marquee series ── */}
      <div className="relative w-full mt-14">
        <p className="text-center text-[12px] font-mono uppercase tracking-[0.2em] text-gray-400 font-semibold mb-7">
          More from the field
        </p>
        <div className="relative w-full overflow-hidden py-4">
          {/* Fade masks */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-white to-transparent" />

          {/* Series row — slides left, pauses + lifts on hover */}
          <div className="flex animate-marquee-reviews">
            {[...EXTRA_REVIEWS, ...EXTRA_REVIEWS].map((r, i) => (
              <SeriesCard key={`${r.name}-${i}`} r={r} idx={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
