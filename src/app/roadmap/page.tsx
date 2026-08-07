import Nav from "@/components/nav";
import { Compass, CheckCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Roadmap — Gauge",
  description: "What we've shipped, what we're building, and what's next. Transparent product development.",
};

interface RoadmapItem {
  title: string;
  status: "shipped" | "in-progress" | "next";
  detail: string;
  date?: string;
}

const shipped: RoadmapItem[] = [
  { title: "Landing page rewrite", status: "shipped", detail: "$9/mo flat pricing, no fake social proof, product preview card", date: "PR #42" },
  { title: "/demo money page", status: "shipped", detail: "5 sample calls with real AI summaries", date: "PR #43" },
  { title: "GDPR export + delete", status: "shipped", detail: "HMAC-signed download tokens, settings UI, 30-day deletion", date: "PR #44" },
  { title: "V1 public API + scoped keys", status: "shipped", detail: "Rate limiting (60/600 req/min), per-key usage tracking", date: "PR #52" },
  { title: "API docs page", status: "shipped", detail: "Dedicated /api-docs/v1 with examples", date: "PR #61" },
  { title: "SEO + JSON-LD + sitemap", status: "shipped", detail: "14 public routes, robots.txt, structured data", date: "PR #53" },
  { title: "ROI calculator on homepage", status: "shipped", detail: "Inline calculator showing savings vs per-seat pricing", date: "PR #59" },
  { title: "Pricing toggle + FAQ", status: "shipped", detail: "Monthly/annual with 17% discount, 6-question FAQ accordion", date: "PR #77" },
  { title: "Competitor comparison pages", status: "shipped", detail: "/vs/otter-ai, /vs/fireflies, /vs/fathom, /vs/tldv, /otter-alternative", date: "PRs #105-#115" },
  { title: "4 vertical prompt templates", status: "shipped", detail: "Sales-BANT, Sales-MEDDIC, Recruiter-fit, Journalist-interview", date: "PR #116" },
  { title: "Cost optimization", status: "shipped", detail: "Whisper-1 → Groq whisper-large-v3 (30x), gpt-4o → gpt-4o-mini (10x), transcript char cap, embedding cap", date: "PRs #124-#127" },
  { title: "Dashboard redesign", status: "shipped", detail: "Actionable stats first, clickable call rows, AI assistant 2-row span", date: "PR #131" },
  { title: "React Doctor CI + doctor.config", status: "shipped", detail: "Score 37 → 0 errors on main, legitimate side-effects ignored", date: "PRs #128-#129" },
];

const inProgress: RoadmapItem[] = [
  { title: "Public /changelog page", status: "in-progress", detail: "This page — rendering CHANGELOG.md as styled HTML" },
  { title: "Public /roadmap page", status: "in-progress", detail: "You're looking at it" },
  { title: "Bot-free marketing page", status: "in-progress", detail: "/no-bot — Otter lawsuit wedge, consent-first design" },
  { title: "Dashboard UX audit", status: "in-progress", detail: "Static audit of all gated routes, P0/P1/P2 issues" },
];

const next: RoadmapItem[] = [
  { title: "Paddle live checkout", status: "next", detail: "Create real Paddle products, wire price IDs, sandbox E2E" },
  { title: "Zoom App Marketplace", status: "next", detail: "4-week submission process, bot-free recording integration" },
  { title: "AI chat with meetings", status: "next", detail: "RAG on existing embeddings — 'Ask Gauge' across all calls" },
  { title: "Public share links (SEO moat)", status: "next", detail: "Opt-in public transcript pages, Google-indexed" },
  { title: "Manager scorecard view", status: "next", detail: "/team page shows scores by rep with comment threads" },
  { title: "Self-host Whisper at scale", status: "next", detail: "faster-whisper on Hetzner at 3k+ users, 80% cost saving" },
  { title: "Real-time live transcription", status: "next", detail: "Streaming Whisper with partial hypotheses, <2s lag" },
  { title: "Mobile app (native)", status: "next", detail: "iOS/Android — PWA-only for v1, native = v2" },
];

function RoadmapSection({
  items,
  icon,
  title,
  accent,
}: {
  items: RoadmapItem[];
  icon: React.ReactNode;
  title: string;
  accent: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <span className={accent}>{icon}</span>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <span className="ml-2 text-sm text-zinc-400">({items.length})</span>
      </div>
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.title} className="doppel-outer">
            <div className="doppel-inner p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-zinc-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.detail}</p>
                </div>
                {item.date && (
                  <span className="shrink-0 text-xs font-mono text-[#F26522] bg-[#F26522]/10 px-2 py-1 rounded-full">
                    {item.date}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <>
      <Nav />
      <main id="main" className="min-h-screen bg-white text-zinc-900">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="eyebrow inline-flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F26522]/10 text-[#F26522] text-[11px] font-semibold">
              <Compass className="w-3.5 h-3.5" />
              Roadmap
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-3">Where we&apos;re going</h1>
          <p className="text-zinc-500 text-lg mb-12">
            What we&apos;ve shipped, what we&apos;re building, and what&apos;s next.
            Transparent product development — no vague &quot;coming soon&quot; cards.
          </p>

          <div className="space-y-12">
            <RoadmapSection
              items={shipped}
              icon={<CheckCircle className="w-6 h-6 text-green-500" />}
              title="Shipped"
              accent=""
            />

            <RoadmapSection
              items={inProgress}
              icon={<Clock className="w-6 h-6 text-[#F26522]" />}
              title="In progress"
              accent=""
            />

            <RoadmapSection
              items={next}
              icon={<ArrowRight className="w-6 h-6 text-zinc-400" />}
              title="Next"
              accent=""
            />
          </div>

          <div className="mt-16 p-6 rounded-2xl bg-zinc-50 border border-zinc-200">
            <p className="text-sm text-zinc-600 leading-relaxed">
              <strong className="text-zinc-900">External-blocked items</strong> (need
              your keys/accounts): Paddle live checkout, Zoom/Meet/Teams dev accounts,
              HubSpot/Salesforce sandbox, Clerk Enterprise SSO, Neon paid plan for
              backups. See{" "}
              <Link href="/changelog" className="text-[#F26522] hover:underline">
                /changelog
              </Link>{" "}
              for the full shipped history.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}