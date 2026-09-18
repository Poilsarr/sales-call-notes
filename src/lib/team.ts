/**
 * Team + advisory roster (FRONTPAGE-OVERHAUL Tasks 3+4).
 *
 * Owner-confirmed (2026-09-18): Kushagarh Singh (Founder), Sandeep Kalra
 * (Advisor), Yogesh (CTO), Samaira (Design). No photos or credentials
 * listed here.
 */

export interface TeamMember {
  /** Seat on the page: Founder, Advisor, CTO, Design… */
  role: string;
  /** Person's name. */
  name: string;
  /** One-line remit, e.g. "Owns transcription pipeline + diarization". */
  focus: string;
  /** 1–2 initials rendered in the avatar circle. */
  initials: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { role: "Founder", name: "Kushagarh Singh", focus: "Vision, product, and competitive-intel roadmap.", initials: "KS" },
  { role: "Advisor", name: "Sandeep Kalra", focus: "Industry guidance and go-to-market support.", initials: "SK" },
  { role: "CTO", name: "Yogesh Garg", focus: "Architecture, AI pipeline, and reliability.", initials: "YG" },
  { role: "Design", name: "Samaira Raina", focus: "Marketing surface, accessibility, and demo craft.", initials: "SR" },
];

export const ADVISORY_NOTE =
  "Building in the open — private beta with 12 teams. Want intro? hello@usegauge.com. Roles update in src/lib/team.ts.";
