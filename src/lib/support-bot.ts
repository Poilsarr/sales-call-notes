/**
 * Support chatbot knowledge base + instant matcher.
 *
 * HOW TO CUSTOMISE (no nuisance, no delay):
 * 1. Edit `SUPPORT_EMAIL` below — it is used in every contact/support answer.
 * 2. Edit / add entries in `SUPPORT_FAQS` — each entry has:
 *    - `id`: stable key
 *    - `keywords`: lowercase words/phrases that trigger this answer
 *    - `answer`: the exact reply shown to the visitor
 * 3. That's it — matching is synchronous (zero network delay) and runs
 *    entirely in the browser.
 *
 * Matching strategy: normalize the visitor's message, score every FAQ by
 * keyword/phrase hits (phrase hits weigh more), return the highest scorer.
 * Anything with no hits falls through to `FALLBACK_ANSWER`.
 */

export const SUPPORT_EMAIL = "teamgauge.pilots@gmail.com";

export const BOT_NAME = "Gauge";

export interface SupportFaq {
  id: string;
  /** lowercase trigger words/phrases — multi-word phrases score higher */
  keywords: string[];
  answer: string;
}

export const SUPPORT_FAQS: SupportFaq[] = [
  {
    id: "contact-team",
    keywords: [
      "reach the team",
      "contact team",
      "contact you",
      "talk to team",
      "talk to human",
      "human support",
      "email",
      "gmail",
      "mail",
      "reach you",
      "get in touch",
      "contact",
      "support",
    ],
    answer: `You can reach our team anytime at ${SUPPORT_EMAIL} — just send us a message there and we'll get back to you. For any inconvenience, message us on that Gmail for support.`,
  },
  {
    id: "what-is-gauge",
    keywords: [
      "what is gauge",
      "what does gauge do",
      "about gauge",
      "what is this",
      "what is this website",
      "what do you do",
      "product",
    ],
    answer:
      "Gauge turns your sales call recordings into summary notes, action items, and CRM-ready follow-ups in seconds — built for SDRs who hate note-taking.",
  },
  {
    id: "how-it-works",
    keywords: [
      "how does it work",
      "how it works",
      "how to use",
      "how do i use",
      "getting started",
      "get started",
      "how to start",
      "upload",
      "record",
    ],
    answer:
      "It's simple: upload your call recording (MP3, WAV, M4A, or WebM) from your dashboard, and Gauge transcribes it and generates a summary, action items, and CRM-ready notes within seconds. Hit the Live demo in the footer to see it first.",
  },
  {
    id: "pricing",
    keywords: [
      "pricing",
      "price",
      "cost",
      "how much",
      "plan",
      "subscription",
      "free",
      "trial",
      "pro",
    ],
    answer:
      "We have a free plan to try Gauge, and Pro plans for heavier usage — annual billing saves 17%. See the full breakdown on the Pricing page. Anything unclear? Write to us at teamgauge.pilots@gmail.com and we'll help you pick.",
  },
  {
    id: "demo",
    keywords: ["demo", "trial run", "see it", "example", "sample", "test it"],
    answer:
      "You can try the live demo from the site footer / homepage — no signup needed. Want a walkthrough? Email us at teamgauge.pilots@gmail.com and we'll set one up.",
  },
  {
    id: "formats",
    keywords: [
      "format",
      "file type",
      "mp3",
      "wav",
      "m4a",
      "webm",
      "audio",
      "file size",
      "upload limit",
      "bulk",
    ],
    answer:
      "Gauge accepts MP3, WAV, M4A, and WebM recordings. For bulk migration from Gong, Fathom, Fireflies, or Otter, export your audio and upload it — or email teamgauge.pilots@gmail.com and we'll help with the move.",
  },
  {
    id: "integrations",
    keywords: [
      "integration",
      "hubspot",
      "salesforce",
      "slack",
      "zapier",
      "crm",
      "teams",
      "meet",
      "zoom",
      "connect",
      "sync",
    ],
    answer:
      "Gauge integrates with HubSpot, Salesforce, Slack, and more (see the Integrations page). For setup help or a tool you don't see listed, message us at teamgauge.pilots@gmail.com.",
  },
  {
    id: "security-privacy",
    keywords: [
      "security",
      "privacy",
      "secure",
      "gdpr",
      "data",
      "delete my data",
      "soc",
      "encryption",
      "safe",
    ],
    answer:
      "Security first: encrypted uploads, strict access controls, and data controls including export/delete on request. Details are on the Security and Privacy pages — or ask us at teamgauge.pilots@gmail.com.",
  },
  {
    id: "support-help",
    keywords: [
      "help",
      "issue",
      "problem",
      "bug",
      "error",
      "not working",
      "broken",
      "stuck",
      "inconvenience",
      "support",
      "fix",
    ],
    answer: `Sorry about that! For any inconvenience, please message us at ${SUPPORT_EMAIL} with what happened (and a screenshot if you can) — our team will sort it out.`,
  },
  {
    id: "refund-billing",
    keywords: [
      "refund",
      "cancel",
      "billing",
      "invoice",
      "charge",
      "payment",
      "checkout",
      "paddle",
    ],
    answer:
      "For billing, cancellations, or refunds, check the Pricing and Refund Policy pages — and email teamgauge.pilots@gmail.com from your account email so we can help fast.",
  },
  {
    id: "api",
    keywords: ["api", "developer", "docs", "key", "webhook", "sdk"],
    answer:
      "Yes — we have REST API docs under API documentation, and you can create v1 keys from the dashboard. Stuck on integration? Email teamgauge.pilots@gmail.com.",
  },
  {
    id: "account",
    keywords: [
      "account",
      "sign up",
      "signup",
      "sign in",
      "login",
      "log in",
      "password",
      "delete account",
      "team",
      "invite",
    ],
    answer:
      "You can sign up / sign in from the top nav. To manage your team, invites, or delete your account, head to Settings — or email teamgauge.pilots@gmail.com and we'll do it with you.",
  },
  {
    id: "status",
    keywords: ["status", "down", "outage", "operational", "slow"],
    answer:
      "You can check live status on the Status page (linked in the footer). If something looks off, tell us at teamgauge.pilots@gmail.com.",
  },
  {
    id: "greeting",
    keywords: ["hello", "hi", "hey", "namaste", "good morning", "good evening", "yo"],
    answer:
      "Hello! I'm Gauge assistant. Ask me anything — pricing, features, integrations, support — or email the team anytime at teamgauge.pilots@gmail.com. How can I help?",
  },
  {
    id: "thanks",
    keywords: ["thank", "thanks", "shukriya", "dhanyavad", "great", "awesome", "perfect"],
    answer:
      "You're welcome! Anything else I can help with? And remember — the team is always at teamgauge.pilots@gmail.com.",
  },
  {
    id: "bye",
    keywords: ["bye", "goodbye", "see you", "alright", "ok thanks", "that's all"],
    answer:
      "Bye for now! If you need anything later, I'm right here — or reach the team at teamgauge.pilots@gmail.com.",
  },
];

export const FALLBACK_ANSWER = `I want to make sure you get the right answer — could you rephrase that a little? In the meantime, for anything urgent you can message our team directly at ${SUPPORT_EMAIL}, and we'll help you out.`;

export const QUICK_REPLIES = [
  "How can I reach the team?",
  "What is Gauge?",
  "Pricing plans?",
  "Which integrations?",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Instant, synchronous FAQ matcher — no network, no delay.
 * Phrase keywords (with a space) score 3, single words score 1.
 */
export function findSupportAnswer(message: string): { id: string; answer: string } {
  const text = normalize(message);
  if (!text) return { id: "fallback", answer: FALLBACK_ANSWER };
  const padded = ` ${text} `;
  const tokens = new Set(text.split(" "));

  const wordHit = (kw: string): boolean => {
    if (padded.includes(` ${kw} `)) return true;
    // Light plural/stemming tolerance: "format" matches "formats", etc.
    if (kw.length < 4) return false;
    for (const t of tokens) {
      if (t.length < 4) continue;
      if (t === kw || t.startsWith(kw) || kw.startsWith(t)) return true;
    }
    return false;
  };

  let best: SupportFaq | null = null;
  let bestScore = 0;

  for (const faq of SUPPORT_FAQS) {
    let score = 0;
    for (const raw of faq.keywords) {
      const kw = normalize(raw);
      if (!kw) continue;
      if (kw.includes(" ")) {
        if (padded.includes(` ${kw} `) || text.includes(kw)) score += 3;
      } else if (wordHit(kw)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = faq;
    }
  }

  if (best && bestScore > 0) return { id: best.id, answer: best.answer };
  return { id: "fallback", answer: FALLBACK_ANSWER };
}
