import Link from "next/link";
import { Key, ArrowLeft, Copy } from "lucide-react";

/**
 * /api-docs/v1 — Public v1 API documentation.
 *
 * Scoped, customer-facing. Mirrors the real /api/v1/* routes shipped
 * in PR #52 (keys) + PR #58 (rate limits). Every claim here must be
 * backed by code; the spec says "no fake stats, no fake features"
 * and that applies to docs too.
 *
 * Server component — zero JS shipped.
 */
export const metadata = {
  title: "API Reference v1",
  description:
    "Public v1 API for Gauge. Generate a scoped API key, then list, create, and revoke keys; list your own calls.",
};

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/keys",
    auth: "Clerk session OR Bearer cn_live_…",
    desc: "List your active API keys. Raw secrets are never returned.",
    response: `{
  "keys": [
    {
      "id": "ck_abc123",
      "name": "Zapier integration",
      "prefix": "cn_live_a1b2c3d4",
      "scope": "read",
      "lastUsedAt": "2026-06-20T17:00:00Z",
      "createdAt": "2026-06-15T10:00:00Z"
    }
  ]
}`,
    errors: ["401 Unauthorized", "500 Internal error"],
  },
  {
    method: "POST",
    path: "/api/v1/keys",
    auth: "Clerk session (creation only — UI recommends Settings → API Keys)",
    desc: "Create a new key. Returns the raw key ONCE — store it now.",
    request: `{
  "name": "Zapier integration",
  "scope": "read"  // optional, default "read"
}`,
    response: `{
  "id": "ck_abc123",
  "name": "Zapier integration",
  "prefix": "cn_live_a1b2c3d4",
  "scope": "read",
  "createdAt": "2026-06-20T17:00:00Z",
  "raw": "cn_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}`,
    errors: [
      "400 Invalid JSON / name required (1-64 chars)",
      "401 Unauthorized",
      "500 Internal error",
    ],
  },
  {
    method: "DELETE",
    path: "/api/v1/keys/[id]",
    auth: "Clerk session OR Bearer cn_live_… (must own the key)",
    desc: "Revoke a key. Audit row is retained; resolveApiKey returns null after.",
    response: `{ "ok": true }`,
    errors: [
      "401 Unauthorized",
      "404 Not found (key does not exist or is not yours)",
      "409 Already revoked",
      "500 Internal error",
    ],
  },
  {
    method: "GET",
    path: "/api/v1/calls",
    auth: "Clerk session OR Bearer cn_live_… (read scope minimum)",
    desc: "List your most recent 50 calls.",
    response: `{
  "calls": [
    {
      "id": "call_xyz",
      "filename": "discovery-acme-2026-06-20.mp3",
      "createdAt": "2026-06-20T17:00:00Z",
      "healthScore": 8.4,
      "duration": 1394,
      "source": "upload"
    }
  ]
}`,
    errors: [
      "401 Unauthorized",
      "403 Insufficient scope (need read or read_write)",
      "429 Rate limit exceeded (with Retry-After)",
      "500 Internal error",
    ],
  },
  {
    method: "POST",
    path: "/api/webhooks",
    auth: "Clerk session (Business plan — webhooks feature)",
    desc: "Register a team webhook endpoint. Secret is auto-generated (32-byte hex) when omitted and returned exactly once on create.",
    request: `{
  "url": "https://example.com/hooks/gauge",
  "secret": "optional-signing-secret",
  "events": ["call.analyzed"]  // subset of call.created, call.analyzed, call.deleted
}`,
    response: `{
  "id": "wh_abc123",
  "url": "https://example.com/hooks/gauge",
  "events": ["call.analyzed"],
  "hasSecret": true,
  "secret": "returned-once-on-create"
}`,
    errors: [
      "400 url required / must start with https://",
      "400 events must be a subset of [call.created, call.analyzed, call.deleted]",
      "400 Webhooks require a team workspace",
      "401 Unauthorized",
      "403 Webhooks are a Business plan feature",
      "500 Internal error",
    ],
  },
  {
    method: "POST",
    path: "/api/cron/webhook-dispatch",
    auth: "Bearer CRON_SECRET (server cron only)",
    desc: "Dispatch up to 20 pending/retrying webhook deliveries due for retry. Retries with 5s timeout + HMAC signature, backoff, max 8 attempts.",
    response: `{
  "processed": 20,
  "delivered": 18,
  "failed": 2
}`,
    errors: [
      "401 Unauthorized (missing or invalid CRON_SECRET)",
      "500 CRON_SECRET not configured",
    ],
  },
  {
    method: "POST",
    path: "/api/v1/bots",
    auth: "Bearer cn_live_… (requires read_write scope)",
    desc: "Dispatch a meeting bot via paste-a-link. Without RECALL_API_KEY the session is stored as pending_manual; with a key the bot joins and a meeting.summary_ready event is enqueued on completion.",
    request: `{
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "title": "Acme discovery"
}`,
    response: `{
  "id": "bot_xyz",
  "status": "pending",
  "mode": "recall",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "platform": "googleMeet"
}`,
    errors: [
      "401 Unauthorized",
      "403 Insufficient scope (need read_write)",
      "400 INVALID_MEETING_URL",
      "429 Rate limit exceeded (with Retry-After)",
      "502 BOT_DISPATCH_FAILED",
    ],
  },
  {
    method: "POST",
    path: "/api/slack/digest",
    auth: "Clerk session (team workspace required)",
    desc: "Post a per-meeting digest (summary + action items + health score) to the team's Slack channel. Accepts an optional risk payload (riskScore, riskFlags, nextQuestions) surfaced in the Slack blocks. When callId is provided, the caller's access is verified with the same IDOR guard as POST /api/slack.",
    request: `{
  "title": "Acme discovery — 2026-09-27",
  "summary": "Agreed on pilot scope…",
  "actionItems": ["Send proposal by Friday"],
  "healthScore": 82,
  "callId": "call_xyz"
}`,
    response: `{
  "delivered": true,
  "channel": "#general"
}`,
    errors: [
      "400 title required",
      "400 team workspace required",
      "401 Unauthorized",
      "403 Forbidden (call belongs to another team)",
      "404 Call not found (when callId provided)",
      "500 Slack digest failed",
    ],
  },
  {
    method: "GET",
    path: "/api/calls/[id]/deal-score",
    auth: "Clerk session (must own the call)",
    desc: "Score a call's deal risk: riskScore out of 64 with risk flags, missing MEDDPICC/BANT fields, and follow-up questions.",
    response: `{
  "riskScore": 42,
  "riskFlags": ["No economic buyer identified"],
  "missingFields": ["budget", "decision_process"],
  "nextQuestions": ["Who signs off on budget?"]
}`,
    errors: [
      "401 Unauthorized",
      "403 Forbidden (call belongs to another user)",
      "404 Call not found",
    ],
  },
];

const SCOPES = [
  {
    name: "read",
    desc: "GET endpoints only. Default for new keys.",
    rateLimit: "60 requests / minute / key",
  },
  {
    name: "read_write",
    desc: "GET, POST, PUT, DELETE. Required for write operations.",
    rateLimit: "600 requests / minute / key",
  },
];

export default function ApiDocsV1() {
  return (
    <main id="main" className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-[960px] mx-auto px-5 sm:px-8 lg:px-12 py-6 flex items-center justify-between">
          <Link
            href="/api-docs"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={14} /> All API docs
          </Link>
          <span className="text-[11px] uppercase tracking-[0.18em] text-gray-400">
            v1 · stable
          </span>
        </div>
      </header>

      <article className="max-w-[960px] mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16">
        <div className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#F26522] mb-3">
            Public API · v1
          </p>
          <h1 className="text-[clamp(1.75rem,4vw,2.8rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-4">
            Gauge REST API
          </h1>
          <p className="text-[15px] text-gray-600 max-w-2xl">
            Authenticate with a Bearer token (format{" "}
            <code className="font-mono text-[13px] bg-gray-100 px-1.5 py-0.5 rounded">
              cn_live_xxx
            </code>{" "}
            for production,{" "}
            <code className="font-mono text-[13px] bg-gray-100 px-1.5 py-0.5 rounded">
              cn_test_xxx
            </code>{" "}
            for test mode). Generate one in{" "}
            <Link
              href="/settings?tab=api-keys"
              className="text-[#F26522] underline-offset-4 hover:underline"
            >
              Settings → API Keys
            </Link>
            . The raw key is shown exactly once at creation time.
          </p>
        </div>

        {/* SCOPES */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium tracking-tight mb-6">Scopes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SCOPES.map((s) => (
              <div
                key={s.name}
                className="border border-gray-200 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Key size={14} className="text-[#F26522]" />
                  <code className="font-mono text-[13px] font-semibold">
                    {s.name}
                  </code>
                </div>
                <p className="text-[13px] text-gray-600 mb-2">{s.desc}</p>
                <p className="text-[12px] text-gray-500">
                  Rate limit: <span className="font-medium">{s.rateLimit}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ENDPOINTS */}
        <section>
          <h2 className="text-2xl font-medium tracking-tight mb-6">Endpoints</h2>
          <div className="space-y-6">
            {ENDPOINTS.map((ep) => (
              <EndpointCard key={ep.path + ep.method} ep={ep} />
            ))}
          </div>
        </section>

        {/* CURL EXAMPLE */}
        <section className="mt-16">
          <h2 className="text-2xl font-medium tracking-tight mb-4">
            Quickstart
          </h2>
          <p className="text-[14px] text-gray-600 mb-4">
            Once you have a key, list your calls:
          </p>
          <pre className="bg-[#0a0a0b] text-white rounded-2xl p-5 text-[13px] font-mono overflow-x-auto">
{`curl -H "Authorization: Bearer cn_live_YOUR_SECRET" \\
     https://usegauge.com/api/v1/calls`}
          </pre>
          <p className="text-[12px] text-gray-500 mt-4">
            The middleware automatically excludes{" "}
            <code className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
              /api/v1/*
            </code>{" "}
            from Clerk session checks so API-key-only requests pass without a
            browser cookie.
          </p>
        </section>

        {/* SUPPORT */}
        <section className="mt-16 p-6 rounded-2xl bg-gray-50 border border-gray-200">
          <h3 className="text-base font-medium mb-2">Need a feature?</h3>
          <p className="text-[13px] text-gray-600">
            Want webhooks, additional scopes, or write endpoints (POST/PUT
            /api/v1/calls)? Open an issue or email{" "}
            <a
              href="mailto:api@usegauge.com"
              className="text-[#F26522] underline-offset-4 hover:underline"
            >
              api@usegauge.com
            </a>
            . Public request log at{" "}
            <a
              href="https://github.com/Poilsarr/sales-call-notes/issues"
              className="text-[#F26522] underline-offset-4 hover:underline"
            >
              github.com/Poilsarr/sales-call-notes
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    PUT: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    DELETE: "bg-red-500/10 text-red-700 border-red-500/20",
  };
  return (
    <span
      className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${colors[method] ?? colors.GET}`}
    >
      {method}
    </span>
  );
}

function EndpointCard({ ep }: { ep: (typeof ENDPOINTS)[number] }) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50/60">
        <MethodBadge method={ep.method} />
        <code className="font-mono text-[13px] text-gray-900">{ep.path}</code>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-[14px] text-gray-700">{ep.desc}</p>
        <Field label="Auth">
          <code className="font-mono text-[12px] text-gray-700">{ep.auth}</code>
        </Field>
        {ep.request && (
          <Field label="Request body">
            <pre className="bg-[#0a0a0b] text-white rounded-lg p-3 text-[12px] font-mono overflow-x-auto">
              {ep.request}
            </pre>
          </Field>
        )}
        <Field label="Response">
          <pre className="bg-[#0a0a0b] text-white rounded-lg p-3 text-[12px] font-mono overflow-x-auto">
            {ep.response}
          </pre>
        </Field>
        <Field label="Error codes">
          <ul className="space-y-1 text-[12px] text-gray-600">
            {ep.errors.map((e) => (
              <li key={e}>
                <code className="font-mono">{e}</code>
              </li>
            ))}
          </ul>
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}