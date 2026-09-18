import { TEAM_MEMBERS, ADVISORY_NOTE } from "@/lib/team";

/**
 * TeamShowcase — advisory-board / team grid on `/` (FRONTPAGE-OVERHAUL Task 3).
 *
 * Server component, zero JS. Placeholder-safe: initials avatars, no invented
 * photos or credentials. Proper `h2` so screen-reader heading nav finds it.
 */
export function TeamShowcase() {
  return (
    <section
      data-track-section="team"
      aria-labelledby="team-heading"
      className="bg-white border-t border-gray-200 pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-600 mb-3">
            Team showcase · Building in the open
          </p>
          <h2
            id="team-heading"
            className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-3"
          >
            The team building your virtual competitor radar.
          </h2>
          <p className="text-gray-700 text-[14px]">{ADVISORY_NOTE}</p>
          <a
            href="mailto:hello@usegauge.com"
            className="inline-flex items-center min-h-[44px] min-w-[44px] text-[14px] font-medium text-[#A84310] underline underline-offset-4 mt-2"
          >
            Talk to the team →
          </a>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
          {TEAM_MEMBERS.map((m) => (
            <li key={m.role} className="doppel-outer">
              <div className="doppel-inner p-6 sm:p-7 h-full flex items-start gap-4">
                <span
                  aria-hidden
                  className="w-11 h-11 shrink-0 rounded-full bg-[#F26522]/10 text-[#C94F17] flex items-center justify-center text-[12px] font-bold tracking-tight"
                >
                  {m.initials}
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-gray-600 font-medium">
                    {m.role}
                  </span>
                  <span className="block text-[15px] font-semibold text-gray-900 tracking-tight">
                    {m.name}
                  </span>
                  <span className="block text-[13px] text-gray-700 leading-relaxed mt-1">
                    {m.focus}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
