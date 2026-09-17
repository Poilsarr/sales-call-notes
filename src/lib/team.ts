/**
 * Team + advisory slots (FRONTPAGE-OVERHAUL Tasks 3+4).
 *
 * Honest-by-design: the repo has no public roster, so these use clearly
 * marked role-forward labels (e.g. "Founder · Gauge team") — not real
 * human names. Replace `name` with the real person when the roster is
 * public and the homepage updates — no code changes needed.
 * Do NOT invent real-sounding humans, photos, or credentials here.
 */

export interface TeamMember {
  /** Seat on the page: Founder, CEO, CTO, CFO, Engineering, Design, GTM… */
  role: string;
  /** Role-forward label — e.g. "Founder · Gauge team" until filled in. */
  name: string;
  /** One-line remit, e.g. "Owns transcription pipeline + diarization". */
  focus: string;
  /** 1–2 initials rendered in the avatar circle. */
  initials: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { role: "Founder", name: "Founder · Gauge team", focus: "Vision, product, and competitive-intel roadmap.", initials: "F" },
  { role: "CEO", name: "CEO · Gauge team", focus: "Customers, revenue, and partnerships.", initials: "CEO" },
  { role: "CTO", name: "CTO · Gauge team", focus: "Architecture, AI pipeline, and reliability.", initials: "CTO" },
  { role: "CFO", name: "CFO · Gauge team", focus: "Pricing, finance, and operations.", initials: "CFO" },
  { role: "Engineering", name: "Engineering · Gauge team", focus: "Transcription, diarization, and Slack alerts.", initials: "EN" },
  { role: "Design", name: "Design · Gauge team", focus: "Marketing surface, accessibility, and demo craft.", initials: "DE" },
];

export const ADVISORY_NOTE =
  "Building in the open — private beta with 12 teams. Roles update in src/lib/team.ts.";
