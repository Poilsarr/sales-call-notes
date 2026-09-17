/**
 * HeroEvidenceStack — pure-DOM static evidence card (zero video bytes).
 *
 * MGMT-FILM-35S-PLAN Part A: right-side premium creative that paints instantly.
 * No <video>, no WebGL, no autoplay, no client JS (server component).
 * Animation is transform/opacity only via existing fadeUp keyframes.
 */

const ACCENT = "#F26522";

export function HeroEvidenceStack() {
  return (
    <div
      data-testid="hero-evidence-stack"
      aria-label="Deal evidence: rival mention, Slack alert, and CRM sync"
      className="relative doppel-outer border-2 border-film-ink shadow-[8px_8px_0_#131316] overflow-hidden bg-film-cream"
    >
      <div className="doppel-inner p-3 sm:p-4 bg-film-cream">
        {/* Header: live pulse + mono label */}
        <div className="flex items-center gap-2 mb-2.5 animate-fade-up">
          <span
            aria-hidden
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: ACCENT }}
          />
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400">
            Live evidence · from call 00:14:22
          </span>
          <span className="ml-auto text-[10px] font-mono text-gray-400">
            conf 0.96
          </span>
        </div>

        {/* Top: transcript line with amber highlight on rival names */}
        <figure className="rounded-xl border border-film-ink/10 bg-white p-2.5 sm:p-3 animate-stagger-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="shrink-0 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full"
              style={{ color: ACCENT, backgroundColor: `${ACCENT}14` }}
            >
              Sarah Chen
            </span>
            <span className="shrink-0 text-[10px] font-mono text-gray-400">
              · 00:14:22
            </span>
          </div>
          <blockquote className="text-[12.5px] text-gray-700 leading-snug">
            &ldquo;We&rsquo;re also evaluating{" "}
            <mark className="rounded px-1 py-px bg-film-amber/30 text-gray-900 font-medium">
              Gong
            </mark>{" "}
            and{" "}
            <mark className="rounded px-1 py-px bg-film-amber/30 text-gray-900 font-medium">
              Chorus
            </mark>{" "}
            for the rollout.&rdquo;
          </blockquote>
        </figure>

        {/* Middle: Slack ping card */}
        <div
          role="note"
          aria-label="Slack alert: competitor detected in #deal-room-acme"
          className="mt-2.5 rounded-xl border border-gray-200 bg-white overflow-hidden animate-stagger-2"
        >
          <div className="flex">
            <span
              aria-hidden
              className="w-1 shrink-0"
              style={{ backgroundColor: ACCENT }}
            />
            <div className="flex-1 p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-semibold text-gray-900">
                  #deal-room-acme
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  · Gauge app 2:14 PM
                </span>
              </div>
              <p className="text-[11px] font-mono tracking-wide text-gray-900">
                Competitor detected: Gong{" "}
                <span className="text-gray-400">(0.96)</span>
              </p>
              <p className="mt-1 text-[11px] text-gray-500 leading-snug">
                Exact quote + speaker + call link — Sarah Chen · Discovery
                00:14:22 ·{" "}
                <span className="underline underline-offset-2 decoration-gray-300">
                  Open call
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: health / rival / CRM row */}
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] font-mono tracking-wide text-gray-500 animate-stagger-3">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Health 8.2
          </span>
          <span>
            Rival: <span className="text-gray-700 font-medium">Gong</span>
          </span>
          <span className="text-gray-500">1-click HubSpot→Salesforce</span>
        </div>
      </div>
    </div>
  );
}
