import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/plans";

function formatMinutes(value: number | "unlimited"): string {
  return value === "unlimited" ? "Unlimited" : `${value.toLocaleString("en-US")}`;
}

/**
 * PricingTeaser — Studio High-Graphics Pricing Showcase.
 *
 * Styled in Gauge brand aesthetic:
 * - Crisp studio neutral background (#F8F9FA) matching the rest of the site
 * - Gauge brand colors: Obsidian black (#121316), Accent Orange (#F26522), Emerald (#10b981)
 * - Clear card hierarchy with full feature checklists, tags, and prominent buttons
 * - Single source of truth from src/lib/plans.ts
 *
 * Server component — no JS shipped.
 */
export function PricingTeaser() {
  const free = PLANS.free;
  const pro = PLANS.pro;
  const business = PLANS.business;

  return (
    <section
      aria-label="Pricing teaser"
      data-track-section="pricing-teaser"
      className="py-16 sm:py-20 lg:py-28 bg-[#F8F9FA] border-t border-b border-black/[0.05]"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10">
        {/* ── Section Header (Gauge Studio Style) ── */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <p className="text-[12px] font-mono uppercase tracking-[0.18em] text-[#F26522] font-semibold mb-3">
            Simple &amp; Transparent
          </p>
          <h2 className="text-[clamp(2.2rem,4vw,3.25rem)] font-medium tracking-[-0.03em] text-gray-900 leading-[1.1] mb-3 text-balance">
            Simple pricing, flat per team
          </h2>
          <p className="text-[15px] sm:text-[16px] text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Start free. Upgrade when your call volume grows — flat per team, no per-seat math, no platform fee.
          </p>
        </div>

        {/* ── 3 Tier Cards Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 items-stretch mb-8">
          {/* ── CARD 1: FREE ── */}
          <div className="rounded-2xl p-7 sm:p-9 bg-white border border-black/[0.07] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              {/* Top Tag */}
              <div className="flex items-center justify-between mb-5">
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wide bg-neutral-100 text-gray-700 border border-black/[0.06]">
                  {free.name}
                </span>
                <span className="text-[12px] font-mono text-gray-400">0 Bots</span>
              </div>

              {/* Title & Description */}
              <h3 className="text-[22px] sm:text-[24px] font-bold text-gray-900 tracking-tight mb-2">
                Get started for free
              </h3>
              <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
                Perfect for individual sales reps and founders looking to capture calls with 0 bots and automate notes effortlessly.
              </p>

              {/* Price Block */}
              <div className="mb-6 pb-6 border-b border-black/[0.06]">
                <div className="flex items-baseline gap-2">
                  <span className="text-[38px] font-bold tracking-tight text-gray-900 leading-none">
                    {free.priceLabel}
                  </span>
                  <span className="text-[14px] text-gray-500 font-normal">forever</span>
                </div>
                <p className="text-[12.5px] font-mono text-gray-500 mt-2">
                  {formatMinutes(free.minuteLimit)} transcription minutes / month
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3 mb-8">
                <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                  Features included:
                </p>
                {[
                  `${formatMinutes(free.minuteLimit)} monthly transcription minutes`,
                  "0 bots in meetings (browser tab audio)",
                  "Automated MEDDPICC meeting summaries",
                  "Basic integrations (Google Meet, Zoom, Slack)",
                  "Export summaries to Markdown & clipboard",
                ].map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5 text-[13.5px] text-gray-700 leading-snug">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                      <Check size={11} strokeWidth={3} />
                    </span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Button */}
            <Link
              href="/sign-up"
              className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-full font-semibold text-[13.5px] bg-neutral-100 hover:bg-neutral-200 text-gray-900 border border-black/[0.06] transition-all"
            >
              <span>Start free →</span>
            </Link>
          </div>

          {/* ── CARD 2: PRO (MOST POPULAR · GAUGE SIGNATURE OBSIDIAN CARD) ── */}
          <div
            className="rounded-2xl p-7 sm:p-9 bg-[#121316] text-white border-2 border-[#F26522] shadow-xl flex flex-col justify-between relative group hover:-translate-y-0.5 transition-all"
          >
            <div>
              {/* Top Tag */}
              <div className="flex items-center justify-between mb-5">
                <span className="px-3.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide bg-[#F26522] text-white shadow-sm">
                  Most popular
                </span>
                <span className="text-[12px] font-mono text-[#F26522] font-semibold">
                  {pro.teamMemberLimit} seats included
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-[22px] sm:text-[24px] font-bold text-white tracking-tight mb-2">
                From {pro.priceLabel}/month flat per team
              </h3>
              <p className="text-[14px] text-white/70 leading-relaxed mb-6">
                Ideal for revenue teams that want real-time competitor battlecards and seamless CRM sync without Gong platform fees.
              </p>

              {/* Price Block */}
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="flex items-baseline gap-2">
                  <span className="text-[38px] font-bold tracking-tight text-white leading-none">
                    {pro.priceLabel}
                  </span>
                  <span className="text-[14px] text-white/60 font-normal">/ month flat</span>
                </div>
                <p className="text-[12.5px] font-mono text-[#F26522] mt-2 font-medium">
                  {formatMinutes(pro.minuteLimit)} minutes / month · {pro.teamMemberLimit} seats included
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3 mb-8">
                <p className="text-[11px] font-mono uppercase tracking-wider text-white/50 font-semibold">
                  Features — Everything in Free, plus:
                </p>
                {[
                  `${formatMinutes(pro.minuteLimit)} minutes / month · ${pro.teamMemberLimit} seats included`,
                  "Real-time live battlecard popups in 2.1s",
                  "Instant Slack alerts when competitors are named",
                  "60-second two-way sync to HubSpot & Salesforce",
                  "Speaker diarization & deal risk scoring",
                ].map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5 text-[13.5px] text-white/90 leading-snug">
                    <span className="w-4 h-4 rounded-full bg-[#F26522]/20 text-[#F26522] flex items-center justify-center shrink-0 mt-0.5 border border-[#F26522]/40">
                      <Check size={11} strokeWidth={3} />
                    </span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Button */}
            <Link
              href="/sign-up"
              className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-full font-semibold text-[13.5px] bg-[#F26522] hover:bg-[#e05a1a] text-white transition-all shadow-md"
            >
              <span>Start free →</span>
            </Link>
          </div>

          {/* ── CARD 3: BUSINESS ── */}
          <div className="rounded-2xl p-7 sm:p-9 bg-white border border-black/[0.07] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              {/* Top Tag */}
              <div className="flex items-center justify-between mb-5">
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  {business.name}
                </span>
                <span className="text-[12px] font-mono text-emerald-600 font-medium">Unlimited seats</span>
              </div>

              {/* Title & Description */}
              <h3 className="text-[22px] sm:text-[24px] font-bold text-gray-900 tracking-tight mb-2">
                From {business.priceLabel}/month flat per team
              </h3>
              <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
                Built for scaling sales organizations that need deep competitive intelligence radar, team analytics, and custom CRM automations.
              </p>

              {/* Price Block */}
              <div className="mb-6 pb-6 border-b border-black/[0.06]">
                <div className="flex items-baseline gap-2">
                  <span className="text-[38px] font-bold tracking-tight text-gray-900 leading-none">
                    {business.priceLabel}
                  </span>
                  <span className="text-[14px] text-gray-500 font-normal">/ month flat</span>
                </div>
                <p className="text-[12.5px] font-mono text-emerald-700 mt-2 font-medium">
                  {formatMinutes(business.minuteLimit)} minutes / month · unlimited seats
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3 mb-8">
                <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                  Features — Everything in Pro, plus:
                </p>
                {[
                  `${formatMinutes(business.minuteLimit)} minutes / month · unlimited seats`,
                  "Custom MEDDPICC, BANT & SPICED deal criteria",
                  "Team-wide competitive intelligence radar board",
                  "Multi-workspace permissions & audit logging",
                  "Priority transcription processing queue",
                ].map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5 text-[13.5px] text-gray-700 leading-snug">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                      <Check size={11} strokeWidth={3} />
                    </span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Button */}
            <a
              href="mailto:sales@usegauge.com?subject=Enterprise%20Plan%20Inquiry"
              className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-full font-semibold text-[13.5px] border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all"
            >
              <span>Contact sales →</span>
            </a>
          </div>
        </div>

        {/* ── Bottom Enterprise / Comparison Strip ── */}
        <div className="rounded-2xl p-6 sm:p-8 bg-white border border-black/[0.06] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-gray-500 font-semibold block">
              Enterprise &amp; Custom Scale
            </span>
            <h4 className="text-[17px] sm:text-[18px] font-semibold text-gray-900 tracking-tight">
              Need dedicated VPC, HIPAA BAA, or custom CRM schemas?
            </h4>
            <p className="text-[13px] text-gray-500 max-w-2xl">
              We provide enterprise volume discounting, custom SLA guarantees, dedicated security reviews, and custom AI fine-tuning.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white text-[13px] font-semibold transition-all"
            >
              <span>Compare all plans →</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PricingTeaser;
