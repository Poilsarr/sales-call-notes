import Link from "next/link";
import { Crosshair } from "lucide-react";

/**
 * RadarMoat — dark band ("Surface no notetaker has").
 *
 * Dark tokens only (pairs against light sections to break the
 * double-dark tunnel once mounted before the film wedge).
 * Server component — no JS shipped.
 */
export default function RadarMoat() {
  return (
    <section
      data-track-section="radar-moat"
      className="bg-[#0a0a0b] text-white border-t border-white/5 py-16 sm:py-20 lg:py-28"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#F26522] mb-3">
            <Crosshair size={12} aria-hidden="true" />
            The moat — virtual competitor radar
          </div>
          <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
            Surface no notetaker has.
          </h2>
          <p className="text-white/75 text-[14px]">
            Live flag + battlecard + cross-call trends.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* (a) Live flag */}
          <div className="doppel-outer-dark">
            <div className="doppel-inner-dark p-6 h-full flex flex-col">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#F26522] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                  aria-hidden="true"
                />
                Live flag
              </span>
              <p className="mt-4 font-mono text-[12px] text-white/85">
                Rival: Gong · 0.96
              </p>
              <blockquote className="mt-2 text-[14px] leading-relaxed text-white/90">
                &ldquo;We&rsquo;re also evaluating Gong for the rollout.&rdquo;
              </blockquote>
              <p className="mt-3 font-mono text-[11px] text-white/60">
                Sarah Chen · 00:14:22
              </p>
            </div>
          </div>

          {/* (b) Battlecard push */}
          <div className="doppel-outer-dark">
            <div className="doppel-inner-dark p-6 h-full flex flex-col">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/60 font-mono mb-3">
                Battlecard push
              </p>
              <p className="text-[15px] font-semibold text-white leading-snug">
                Gong objection-handling card pushed to the deal room
              </p>
              <div className="mt-4 space-y-2 font-mono text-[12px]">
                <p className="text-white/85">
                  Slack ping →{" "}
                  <span className="text-white">#deal-room-acme</span>
                </p>
                <p className="text-white/60">
                  Salesforce field: Competitor__c = Gong
                </p>
              </div>
            </div>
          </div>

          {/* (c) Cross-call aggregation chart (inline SVG, no chart lib) */}
          <div className="doppel-outer-dark">
            <div className="doppel-inner-dark p-6 h-full flex flex-col">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/60 font-mono mb-3">
                Cross-call trends
              </p>
              <svg
                viewBox="0 0 300 160"
                role="img"
                aria-label="Competitor mentions across calls: Gong 12, Chorus 7, Fireflies 4"
                className="w-full h-auto"
              >
                <line
                  x1="32"
                  y1="8"
                  x2="32"
                  y2="140"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                />
                <line
                  x1="32"
                  y1="140"
                  x2="292"
                  y2="140"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                />
                <rect x="52" y="44" width="56" height="96" rx="6" fill="#0E7C6B" />
                <rect x="122" y="84" width="56" height="56" rx="6" fill="#D9A21B" />
                <rect x="192" y="108" width="56" height="32" rx="6" fill="#E8442E" />
                <text x="80" y="152" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.6)" fontFamily="monospace">
                  Gong 12
                </text>
                <text x="150" y="152" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.6)" fontFamily="monospace">
                  Chorus 7
                </text>
                <text x="220" y="152" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.6)" fontFamily="monospace">
                  Fflies 4
                </text>
                <polyline
                  points="80,44 150,84 220,108"
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              </svg>
              <p className="mt-3 text-[12px] text-white/60">
                Rival share across your last 50 calls.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 lg:mt-14 flex flex-col sm:flex-row gap-3">
          <a href="#demo" className="btn-primary w-fit">
            See radar live
          </a>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-full px-6 py-3 font-medium border border-white/15 text-white/90 hover:bg-white/5 transition-all w-fit"
          >
            Start free
          </Link>
        </div>
      </div>
    </section>
  );
}
