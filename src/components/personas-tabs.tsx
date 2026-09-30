"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Compass, User, Users, Zap } from "lucide-react";
import { HOMEPAGE_COPY } from "@/lib/homepage-copy";

/**
 * PersonasTabs (GAUGE-REDESIGN-PART2 P2A) — tabbed AE/SDR/Manager/RevOps/Founder.
 *
 * Data is derived from social-proof SEGMENTS (3) + use-cases CASES (4),
 * deduped to 5 tabs (Discovery folds into the AE tab). Founder tab is the
 * honest beta voice — no invented names or logos (PR #42 memorial).
 *
 * Tab a11y mirrors live-proof-strip: aria-pressed + aria-label on each
 * button, active `bg-gray-900 text-white`. Card shell is
 * doppel-outer > doppel-inner p-6 with a peach icon chip.
 *
 * VISUAL-DENSITY D3: the tab pane is a 2-col grid (text left, coded mini
 * visual right). All copy below is verbatim; visuals are decorative coded
 * mocks (no binaries, no new claims). The peach icon chip remains the
 * single F26522 marker — visuals use neutral/cool accents only.
 */

interface Persona {
  id: string;
  label: string;
  icon: typeof User;
  headline: string;
  body: string;
  radar: string;
  ctaLabel: string;
  ctaHref: string;
}

export const PERSONAS: Persona[] = [
  {
    id: "solo-sdr",
    label: "Solo SDRs",
    icon: User,
    headline: "Solo SDRs — notes done in 60 seconds",
    // From social-proof SEGMENTS[0].
    body: "Drop an MP3, get a summary + action items + CRM-ready notes in 60 seconds. Free forever tier.",
    radar:
      "Rival named at minute 30 of discovery — exact quote + speaker in Slack before it becomes an objection.",
    ctaLabel: "Learn more →",
    ctaHref: "/features",
  },
  {
    id: "ae-discovery",
    label: "AE/Discovery",
    icon: Compass,
    headline: "AEs — win the discovery",
    // From use-cases CASES Discovery.
    body: "Catch every rival name early — exact quote + speaker, before it becomes an objection.",
    radar:
      "Procurement one-pager with owners, dates, and decisions pulled from the call — sent on time, not Friday.",
    ctaLabel: "See a demo →",
    ctaHref: "/demo",
  },
  {
    id: "revops",
    label: "RevOps",
    icon: Users,
    headline: "RevOps — every call structured in the CRM",
    // From social-proof SEGMENTS[1].
    body: "Push structured notes to HubSpot or Salesforce on every call. MEDDIC fields auto-populated.",
    radar:
      "Rival mentions land structured alongside owners and dates — no manual CRM cleanup.",
    ctaLabel: "Learn more →",
    ctaHref: "/features",
  },
  {
    id: "sales-managers",
    label: "Sales managers",
    icon: Building2,
    headline: "Sales managers — coach with evidence",
    // From social-proof SEGMENTS[2]; radar angle from use-cases CASES Coaching.
    body: "See every team's calls, talk ratios, and competitor mentions in one dashboard. Alerts on the deals that matter.",
    radar:
      "Talk time + sentiment per rep — see who listens, who pitches, who closes.",
    ctaLabel: "See a demo →",
    ctaHref: "/demo",
  },
  {
    id: "founder",
    label: "Founder",
    icon: Zap,
    headline: "Founders — sell while you build",
    // Honest beta voice: reuses use-cases Q3-review line, no invented logos.
    body: `Running founder-led sales with no team to debrief you. Upload today's call and walk into the follow-up with history — every mention, commitment, and follow-up, not guesses. Currently in private beta — ${HOMEPAGE_COPY.proof.betaTeams} building in the open.`,
    radar:
      "One dashboard for every deal — rival mentions, commitments, and follow-ups while you build in the open.",
    ctaLabel: "See a demo →",
    ctaHref: "/demo",
  },
];

function SoloTranscriptMini() {
  return (
    <div
      data-testid="persona-visual-transcript"
      aria-label="Transcript preview"
      className="rounded-xl border border-film-ink/10 bg-film-cream p-4"
    >
      <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-3">
        Transcript · 00:30:12
      </p>
      <div className="space-y-2 text-[12px] leading-snug">
        <p className="text-gray-600">
          <span className="font-mono text-[10px] text-gray-400 mr-2">
            30:04
          </span>
          <span className="font-medium text-gray-900">Rep: </span>
          Walk me through the rollout…
        </p>
        <p className="rounded-lg bg-white border border-film-ink/10 p-2.5 text-gray-700">
          <span className="font-mono text-[10px] text-gray-400 mr-2">
            30:12
          </span>
          <span className="font-medium text-gray-900">Prospect: </span>
          We&rsquo;re also evaluating Gong…
        </p>
        <p className="flex items-center gap-2 pt-1">
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full leading-none bg-gray-900 text-white">
            Rival: Gong
          </span>
          <span className="text-[10px] font-mono text-gray-500">
            quote + speaker
          </span>
        </p>
      </div>
    </div>
  );
}

function AeSlackMini() {
  return (
    <div
      data-testid="persona-visual-slack"
      aria-label="Slack ping preview"
      className="rounded-xl border border-film-ink/10 bg-film-cream p-4"
    >
      <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-3">
        #deal-room-acme · Slack ping
      </p>
      <div className="rounded-lg bg-white border border-film-ink/10 p-3 mb-2">
        <p className="text-[12px] text-gray-700 leading-snug mb-2">
          &ldquo;We&rsquo;re also evaluating Gong for the rollout.&rdquo;
        </p>
        <p className="text-[10px] font-mono text-gray-500">
          Maya · Discovery · 30:12
        </p>
      </div>
      <p className="text-[10px] font-mono text-gray-500">
        exact quote + speaker
      </p>
    </div>
  );
}

function RevOpsCrmMini() {
  const fields = [
    { label: "Deal", value: "Acme Corp · Discovery" },
    { label: "Owner", value: "Sarah Chen" },
    { label: "MEDDIC", value: "Champion identified" },
    { label: "Next step", value: "Send one-pager · THU" },
  ];
  return (
    <div
      data-testid="persona-visual-crm"
      aria-label="CRM field preview"
      className="rounded-xl border border-film-ink/10 bg-film-cream p-4"
    >
      <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-3">
        CRM sync · HubSpot → Salesforce
      </p>
      <dl className="rounded-lg border border-film-ink/10 bg-white divide-y divide-gray-100 mb-2">
        {fields.map((field) => (
          <div key={field.label} className="flex items-baseline gap-3 px-3 py-1.5">
            <dt className="shrink-0 w-20 text-[10px] font-mono uppercase tracking-wider text-gray-500">
              {field.label}
            </dt>
            <dd className="text-[12px] font-medium text-gray-900 truncate">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-[10px] font-mono text-gray-500">
        no manual cleanup
      </p>
    </div>
  );
}

const TALK_BARS = [
  { rep: "Maya", pct: 32 },
  { rep: "Jon", pct: 58 },
  { rep: "Pri", pct: 45 },
];

function ManagersBarsMini() {
  return (
    <div
      data-testid="persona-visual-bars"
      role="img"
      aria-label="Talk ratio per rep preview"
      className="rounded-xl border border-film-ink/10 bg-film-cream p-4"
    >
      <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-3">
        Talk ratio · per rep
      </p>
      <div className="space-y-3">
        {TALK_BARS.map((bar) => (
          <div key={bar.rep}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[12px] font-medium text-gray-900">
                {bar.rep}
              </span>
              <span className="text-[10px] font-mono text-gray-500">
                {bar.pct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gray-900"
                style={{ width: `${bar.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] font-mono text-gray-500 mt-3">
        who listens, who pitches, who closes
      </p>
    </div>
  );
}

function FounderStatMini() {
  return (
    <div
      data-testid="persona-visual-stat"
      aria-label="Founder pipeline preview"
      className="rounded-xl border border-film-ink/10 bg-film-cream p-4"
    >
      <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-3">
        Today&rsquo;s pipeline
      </p>
      <p className="text-4xl font-bold tracking-tight text-gray-900 leading-none">
        12
      </p>
      <p className="text-[12px] font-medium text-gray-900 mt-1">
        beta teams building in the open
      </p>
      <p className="text-[10px] font-mono text-gray-500 mt-2">
        500+ calls processed
      </p>
      <p className="mt-3 border-t border-film-ink/10 pt-3 text-[12px] leading-snug text-gray-700">
        every mention, commitment, and follow-up
      </p>
    </div>
  );
}

function PersonaVisual({ id }: { id: string }) {
  switch (id) {
    case "solo-sdr":
      return <SoloTranscriptMini />;
    case "ae-discovery":
      return <AeSlackMini />;
    case "revops":
      return <RevOpsCrmMini />;
    case "sales-managers":
      return <ManagersBarsMini />;
    case "founder":
      return <FounderStatMini />;
    default:
      return null;
  }
}

export default function PersonasTabs() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = PERSONAS[activeIdx];
  const ActiveIcon = active.icon;

  return (
    <section
      data-track-section="personas"
      aria-label="Personas — pick your seat"
      className="bg-white border-t border-gray-200"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-28">
        <div className="max-w-2xl mb-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-600 mb-3">
            Who it&apos;s for
          </p>
          <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900">
            Pick your seat. Gauge does the notes.
          </h2>
        </div>

        <div className="flex flex-wrap gap-2 mb-6" aria-label="Personas">
          {PERSONAS.map((p, i) => (
            <button
              key={p.id}
              aria-pressed={i === activeIdx}
              aria-label={`Show ${p.label} workflow`}
              onClick={() => setActiveIdx(i)}
              className={`rounded-full border-2 border-gray-900 px-4 py-1.5 text-[13px] font-medium transition-colors ${
                i === activeIdx
                  ? "bg-gray-900 text-white"
                  : "text-gray-900 hover:bg-gray-900 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="doppel-outer max-w-4xl">
          <div
            className="doppel-inner p-6"
            aria-live="polite"
            aria-label={`${active.label} details`}
          >
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 border border-[#F26522]/20 flex items-center justify-center mb-5">
                  <ActiveIcon
                    size={18}
                    className="text-[#F26522]"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-semibold tracking-tight text-gray-900 mb-2 text-[15px]">
                  {active.headline}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {active.body}
                </p>
                <p className="mt-4 border-t border-gray-100 pt-4 text-[13px] leading-relaxed text-gray-700">
                  <span className="font-medium text-gray-900">Radar angle: </span>
                  {active.radar}
                </p>
                <Link
                  href={active.ctaHref}
                  aria-label={`${active.ctaLabel.replace(" →", "")} for ${active.label}`}
                  className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-[#F26522] hover:underline"
                >
                  {active.ctaLabel}
                </Link>
              </div>
              <PersonaVisual id={active.id} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
