import Link from "next/link";
import { Crosshair } from "lucide-react";
import { DEMO_ACME, PRODUCT_STILLS } from "@/lib/demo-call-fiction";

/**
 * RadarMoat — dark band ("Surface no notetaker has").
 *
 * Dark tokens only (pairs against light sections to break the
 * double-dark tunnel once mounted before the film wedge).
 * Fiction SSOT + radar still (GAUGE-MASTERPIECE).
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
                Rival: {DEMO_ACME.rival} · {DEMO_ACME.confidence}
              </p>
              <blockquote className="mt-2 text-[14px] leading-relaxed text-white/90">
                &ldquo;We&rsquo;re also evaluating Gong for the rollout.&rdquo;
              </blockquote>
              <p className="mt-3 font-mono text-[11px] text-white/60">
                {DEMO_ACME.speaker} · {DEMO_ACME.timestamp}
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
                  <span className="text-white">{DEMO_ACME.slackChannel}</span>
                </p>
                <p className="text-white/60">
                  Salesforce field: Competitor__c = {DEMO_ACME.rival}
                </p>
              </div>
            </div>
          </div>

          {/* (c) Radar board still */}
          <div className="doppel-outer-dark">
            <div className="doppel-inner-dark p-0 overflow-hidden h-full flex flex-col">
              <div className="p-6 pb-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/60 font-mono mb-3">
                  Cross-call trends
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PRODUCT_STILLS.radar}
                alt="Competitor mentions across calls: Gong 12, Chorus 7, Fireflies 4"
                width={640}
                height={400}
                className="block w-full h-auto px-3"
              />
              <p className="px-6 pb-6 mt-3 text-[12px] text-white/60">
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
