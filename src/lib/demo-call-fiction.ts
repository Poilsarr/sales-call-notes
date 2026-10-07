/**
 * Single source of truth for marketing demo-call fiction.
 *
 * Used by product visuals, evidence, live-proof, radar, and the film wedge
 * so the same Acme/Gong narrative is not reinvented per section.
 * Sample / beta honesty rules still apply at render sites.
 */

export interface DemoCallSignal {
  callName: string;
  speaker: string;
  timestamp: string;
  rival: string;
  quote: string;
  slackChannel: string;
  confidence: number;
  age?: string;
  accent?: string;
}

/** Primary demo beat — Acme discovery / Gong. */
export const DEMO_ACME: DemoCallSignal = {
  callName: "Acme Corp · Discovery",
  speaker: "Sarah Chen",
  timestamp: "00:14:22",
  rival: "Gong",
  quote: "We're also evaluating Gong and Chorus for the rollout.",
  slackChannel: "#deal-room-acme",
  confidence: 0.96,
  age: "2 min ago",
  accent: "#F26522",
};

/** Secondary beat — Vandelay / Otter (use sparingly; ≤2 page appearances). */
export const DEMO_VANDELAY: DemoCallSignal = {
  callName: "Vandelay Industries · Demo",
  speaker: "Priya Shah",
  timestamp: "11:42:08",
  rival: "Otter.ai",
  quote:
    "Our current contract with Otter expires in Q3 — what would migration look like?",
  slackChannel: "#deal-room-vandelay",
  confidence: 0.91,
  age: "18 min ago",
  accent: "#2563eb",
};

/** Tertiary beat — Stark / Fireflies. */
export const DEMO_STARK: DemoCallSignal = {
  callName: "Stark Industries · Closing",
  speaker: "Marcus Lee",
  timestamp: "09:03:51",
  rival: "Fireflies.ai",
  quote:
    "Fireflies is cheaper but your competitive-intel alerts are the deciding factor for us.",
  slackChannel: "#deal-room-stark",
  confidence: 0.99,
  age: "1 hr ago",
  accent: "#7c3aed",
};

/** Film wedge shows one hero alert only (dedupe). */
export const FILM_HERO_ALERT = DEMO_ACME;

export const PRODUCT_STILLS = {
  transcript: "/product/transcript-proof.svg",
  slack: "/product/slack-ping.svg",
  crm: "/product/crm-sync.svg",
  radar: "/product/radar-board.svg",
  coach: "/product/coach-talk.svg",
  summary: "/product/summary-owners.svg",
  meet: "/product/meet-extension.svg",
} as const;

export type ProductStillKey = keyof typeof PRODUCT_STILLS;
