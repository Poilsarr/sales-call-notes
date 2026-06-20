/**
 * /demo sample data (Level 5.3 demo route).
 *
 * Hardcoded representative call transcripts with realistic competitor
 * mentions. NOT real customer data — the page itself states this.
 * Pure presentation; no DB, no auth, no PII.
 */

export type CompetitorHit = {
  competitor: string;
  speaker: string;
  line: string;
  timestamp: string;
  sentiment: "negative" | "neutral" | "evaluating";
  confidence: number;
};

export type DemoCall = {
  id: string;
  customer: string;
  stage: "Discovery" | "Demo" | "Negotiation" | "Procurement";
  rep: string;
  duration: string;
  date: string;
  healthScore: number;
  mentions: number;
  primaryCompetitor: string;
  transcript: Array<{ time: string; speaker: string; text: string }>;
  alerts: CompetitorHit[];
};

export const DEMO_CALLS: DemoCall[] = [
  {
    id: "call_acme_discovery",
    customer: "Acme Corp",
    stage: "Discovery",
    rep: "Sarah Chen",
    duration: "23:14",
    date: "Today, 9:42 AM",
    healthScore: 8.4,
    mentions: 3,
    primaryCompetitor: "Gong",
    transcript: [
      { time: "00:14:22", speaker: "Prospect", text: "We're also evaluating Gong and Chorus for the rollout." },
      { time: "00:14:38", speaker: "Agent", text: "Totally fair — both are great tools. Can I ask what triggered the evaluation?" },
      { time: "00:14:51", speaker: "Prospect", text: "Our VP of Sales has used Gong at his last company. He likes the dashboards." },
    ],
    alerts: [
      {
        competitor: "Gong",
        speaker: "Prospect",
        line: "We're also evaluating Gong and Chorus for the rollout.",
        timestamp: "00:14:22",
        sentiment: "evaluating",
        confidence: 0.96,
      },
      {
        competitor: "Chorus",
        speaker: "Prospect",
        line: "We're also evaluating Gong and Chorus for the rollout.",
        timestamp: "00:14:22",
        sentiment: "evaluating",
        confidence: 0.88,
      },
      {
        competitor: "Gong",
        speaker: "Prospect",
        line: "Our VP of Sales has used Gong at his last company. He likes the dashboards.",
        timestamp: "00:14:51",
        sentiment: "neutral",
        confidence: 0.91,
      },
    ],
  },
  {
    id: "call_globex_demo",
    customer: "Globex Inc",
    stage: "Demo",
    rep: "Marcus Reid",
    duration: "31:08",
    date: "Yesterday, 2:15 PM",
    healthScore: 6.9,
    mentions: 2,
    primaryCompetitor: "Otter",
    transcript: [
      { time: "00:08:11", speaker: "Champion", text: "My team is already on Otter. Pulling that data into your tool, would that work?" },
      { time: "00:08:25", speaker: "Agent", text: "Yes — we have a one-click Otter import. Ten minutes, done." },
      { time: "00:08:42", speaker: "Champion", text: "Cool. And what about the AI scoring — does that match what Otter produces?" },
    ],
    alerts: [
      {
        competitor: "Otter",
        speaker: "Champion",
        line: "My team is already on Otter.",
        timestamp: "00:08:11",
        sentiment: "neutral",
        confidence: 0.94,
      },
      {
        competitor: "Otter",
        speaker: "Champion",
        line: "does that match what Otter produces?",
        timestamp: "00:08:42",
        sentiment: "evaluating",
        confidence: 0.87,
      },
    ],
  },
  {
    id: "call_initech_negotiation",
    customer: "Initech",
    stage: "Negotiation",
    rep: "Priya Singh",
    duration: "42:55",
    date: "2 days ago",
    healthScore: 7.8,
    mentions: 4,
    primaryCompetitor: "Fireflies",
    transcript: [
      { time: "00:21:04", speaker: "Prospect", text: "Fireflies pitched us last quarter. Their pricing was about 30% lower." },
      { time: "00:21:22", speaker: "Agent", text: "How did you feel about their accuracy on the demo calls we sent?" },
      { time: "00:21:40", speaker: "Prospect", text: "Honestly, the action items were hit or miss. That's why we're still talking." },
    ],
    alerts: [
      {
        competitor: "Fireflies",
        speaker: "Prospect",
        line: "Fireflies pitched us last quarter.",
        timestamp: "00:21:04",
        sentiment: "negative",
        confidence: 0.97,
      },
      {
        competitor: "Fireflies",
        speaker: "Prospect",
        line: "Their pricing was about 30% lower.",
        timestamp: "00:21:04",
        sentiment: "negative",
        confidence: 0.82,
      },
      {
        competitor: "Fireflies",
        speaker: "Prospect",
        line: "the action items were hit or miss.",
        timestamp: "00:21:40",
        sentiment: "negative",
        confidence: 0.89,
      },
      {
        competitor: "Fireflies",
        speaker: "Prospect",
        line: "That's why we're still talking.",
        timestamp: "00:21:40",
        sentiment: "negative",
        confidence: 0.74,
      },
    ],
  },
  {
    id: "call_umbrella_procurement",
    customer: "Umbrella Corp",
    stage: "Procurement",
    rep: "David Park",
    duration: "18:32",
    date: "3 days ago",
    healthScore: 9.1,
    mentions: 1,
    primaryCompetitor: "Gong",
    transcript: [
      { time: "00:05:18", speaker: "Procurement", text: "We tried Gong in 2023. The renewal was too aggressive. We moved off." },
      { time: "00:05:34", speaker: "Agent", text: "Appreciate you sharing that. We're month-to-month, no auto-renew surprises." },
      { time: "00:05:48", speaker: "Procurement", text: "Good. Legal will want that in writing." },
    ],
    alerts: [
      {
        competitor: "Gong",
        speaker: "Procurement",
        line: "We tried Gong in 2023. The renewal was too aggressive.",
        timestamp: "00:05:18",
        sentiment: "negative",
        confidence: 0.93,
      },
    ],
  },
  {
    id: "call_wayne_discovery",
    customer: "Wayne Enterprises",
    stage: "Discovery",
    rep: "Aisha Khan",
    duration: "27:01",
    date: "Last week",
    healthScore: 8.7,
    mentions: 2,
    primaryCompetitor: "Chorus",
    transcript: [
      { time: "00:12:00", speaker: "Prospect", text: "Chorus is the incumbent here. Switching cost is real." },
      { time: "00:12:18", speaker: "Agent", text: "We have a Chorus migration playbook. Most teams are fully cut over in two weeks." },
      { time: "00:12:34", speaker: "Prospect", text: "Send me the playbook. And the pricing — Chorus is locking us in on a 3-year." },
    ],
    alerts: [
      {
        competitor: "Chorus",
        speaker: "Prospect",
        line: "Chorus is the incumbent here. Switching cost is real.",
        timestamp: "00:12:00",
        sentiment: "evaluating",
        confidence: 0.95,
      },
      {
        competitor: "Chorus",
        speaker: "Prospect",
        line: "Chorus is locking us in on a 3-year.",
        timestamp: "00:12:34",
        sentiment: "negative",
        confidence: 0.88,
      },
    ],
  },
];

export function sentimentClasses(s: CompetitorHit["sentiment"]) {
  if (s === "negative") return "bg-red-500/10 text-red-400 border-red-500/20";
  if (s === "evaluating") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-white/5 text-white/60 border-white/10";
}