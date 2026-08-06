import Link from "next/link";
import { ArrowRight, Code, AlertCircle } from "lucide-react";

/**
 * /api-docs — index page listing available API documentation.
 *
 * Currently only /api-docs/v1 exists (hand-written, shipped in
 * PR #61). Future versions would land here as additional cards.
 *
 * Server component, zero JS shipped.
 */
export const metadata = {
  title: "API Documentation",
  description: "Public API documentation for Gauge.",
};

const AVAILABLE_VERSIONS = [
  {
    label: "v1",
    status: "stable" as const,
    desc: "Public scoped API keys. Generate, list, and revoke keys; list your own calls. Bearer-token auth.",
    href: "/api-docs/v1",
    released: "2026-06-21",
    endpoints: 4,
  },
];

const PLANNED_VERSIONS = [
  {
    label: "v1 webhooks",
    status: "planned" as const,
    desc: "Subscribe to events: call.completed, action_item.created, crm.synced. HMAC-signed payloads.",
  },
  {
    label: "v2 write endpoints",
    status: "planned" as const,
    desc: "POST /api/v2/calls (upload), PUT /api/v2/calls/[id] (update notes). Multi-part upload for audio.",
  },
];

export default function ApiDocsIndex() {
  return (
    <main id="main" className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200">
        <div className="max-w-[960px] mx-auto px-5 sm:px-8 lg:px-12 py-8">
          <div className="flex items-center gap-2 mb-3">
            <Code size={14} className="text-[#F26522]" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-gray-400">
              Developer reference
            </span>
          </div>
          <h1 className="text-[clamp(1.75rem,4vw,2.8rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
            API documentation
          </h1>
          <p className="text-[15px] text-gray-600 max-w-2xl">
            REST API for Gauge. All requests use a Bearer token
            (cn_live_… or cn_test_…). Generate a key in{" "}
            <Link
              href="/settings?tab=api-keys"
              className="text-[#F26522] underline-offset-4 hover:underline"
            >
              Settings → API Keys
            </Link>
            .
          </p>
        </div>
      </header>

      <article className="max-w-[960px] mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16 space-y-12">
        {/* AVAILABLE */}
        <section>
          <h2 className="text-2xl font-medium tracking-tight mb-6">
            Available versions
          </h2>
          <div className="space-y-3">
            {AVAILABLE_VERSIONS.map((v) => (
              <Link
                key={v.label}
                href={v.href}
                className="block border border-gray-200 rounded-2xl p-6 hover:border-[#F26522]/40 hover:bg-[#F26522]/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <code className="font-mono text-[15px] font-semibold text-gray-900">
                      {v.label}
                    </code>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      {v.status}
                    </span>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-400 group-hover:text-[#F26522]"
                  />
                </div>
                <p className="text-[14px] text-gray-700 mb-2">{v.desc}</p>
                <p className="text-[12px] text-gray-500">
                  Released {v.released} · {v.endpoints} endpoint
                  {v.endpoints === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* PLANNED */}
        <section>
          <h2 className="text-2xl font-medium tracking-tight mb-6">Planned</h2>
          <div className="space-y-3">
            {PLANNED_VERSIONS.map((v) => (
              <div
                key={v.label}
                className="border border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <code className="font-mono text-[15px] font-semibold text-gray-500">
                    {v.label}
                  </code>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                    planned
                  </span>
                </div>
                <p className="text-[14px] text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle
              size={16}
              className="text-amber-700 mt-0.5 shrink-0"
            />
            <p className="text-[12px] text-amber-900">
              Roadmap is internal. Public feature requests go to{" "}
              <a
                href="https://github.com/Poilsarr/sales-call-notes/issues"
                className="underline"
              >
                github.com/Poilsarr/sales-call-notes/issues
              </a>
              . Don&apos;t depend on &quot;planned&quot; endpoints — they may
              never ship.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}