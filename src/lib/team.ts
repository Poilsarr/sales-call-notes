/**
 * Team + advisory roster (FRONTPAGE-OVERHAUL Tasks 3+4).
 *
 * Owner-supplied (2026-09-18): Kushagarh Singh (Founder) + Sandeep Kalra
 * (Advisor). Remaining seats are owner-approved placeholder names —
 * replace `name` with the real hire when public; homepage updates with
 * no code changes needed. No photos or credentials listed here.
 */

export interface TeamMember {
  /** Seat on the page: Founder, CEO, CTO, CFO, Engineering, Design, GTM… */
  role: string;
  /** Person's name — placeholder until the real hire is public. */
  name: string;
  /** One-line remit, e.g. "Owns transcription pipeline + diarization". */
  focus: string;
  /** 1–2 initials rendered in the avatar circle. */
  initials: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { role: "Founder", name: "Kushagarh Singh", focus: "Vision, product, and competitive-intel roadmap.", initials: "KS" },
  { role: "Advisor", name: "Sandeep Kalra", focus: "Industry guidance and go-to-market support.", initials: "SK" },
  { role: "CEO", name: "Aditya Rao", focus: "Customers, revenue, and partnerships.", initials: "AR" },
  { role: "CTO", name: "Vikram Nair", focus: "Architecture, AI pipeline, and reliability.", initials: "VN" },
  { role: "CFO", name: "Neha Sharma", focus: "Pricing, finance, and operations.", initials: "NS" },
  { role: "Engineering", name: "Arjun Patel", focus: "Transcription, diarization, and Slack alerts.", initials: "AP" },
  { role: "Design", name: "Priya Iyer", focus: "Marketing surface, accessibility, and demo craft.", initials: "PI" },
  { role: "GTM", name: "Kabir Malhotra", focus: "Positioning, pricing page, and beta onboarding.", initials: "KM" },
  { role: "Customer", name: "Ananya Gupta", focus: "Support, docs, and beta feedback loops.", initials: "AG" },
];

export const ADVISORY_NOTE =
  "Building in the open — private beta with 12 teams. Want intro? hello@usegauge.com. Roles update in src/lib/team.ts.";
