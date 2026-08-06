
import Nav from "@/components/nav";

export const metadata = {
  title: "Security — Gauge",
  description:
    "Gauge protects your data: TLS in transit, encryption at rest, DPA, no AI training on call data, sub-processor transparency, GDPR export.",
};

type ChecklistItem = {
  item: string;
  status: "Live" | "Partial" | "Roadmap" | "N/A";
  detail: string;
};

const checklist: ChecklistItem[] = [
  {
    item: "Encryption at rest and in transit",
    status: "Live",
    detail: "TLS 1.2+ with HSTS preload in transit; data at rest encrypted on Neon PostgreSQL (US East).",
  },
  {
    item: "SOC 2 Type II",
    status: "Roadmap",
    detail: "Our readiness program is in progress. We will not claim certification until it is real.",
  },
  {
    item: "GDPR compliance + DPA (Art. 28)",
    status: "Live",
    detail: "EU data-export right, data-processor terms under Art. 28. DPA available on request via security@usegauge.com.",
  },
  {
    item: "HIPAA BAA",
    status: "N/A",
    detail: "We are not a healthcare service and do not support PHI workflows.",
  },
  {
    item: "Data never used for AI training",
    status: "Live",
    detail: "Included in our DPA (available on request). See the no-training clause above.",
  },
  {
    item: "Role-based access control",
    status: "Live",
    detail: "Admin / Member roles with granular team permissions.",
  },
  {
    item: "Configurable data retention",
    status: "Roadmap",
    detail: "Account deletion is available today (7-day soft-delete with confirmation); retention controls are planned.",
  },
  {
    item: "SSO via SAML 2.0",
    status: "Roadmap",
    detail: "Planned for our enterprise tier (Clerk Enterprise).",
  },
  {
    item: "Sub-processor transparency",
    status: "Live",
    detail: "Full inventory below, plus 30-day notice before any new sub-processor touches your data.",
  },
  {
    item: "Data residency control",
    status: "Partial",
    detail: "US East today; regional residency is planned.",
  },
  {
    item: "Data portability + deletion confirmation",
    status: "Live",
    detail: "Full GDPR export of every call, transcript, action item, decision, next step, and comment; deletion requires explicit double confirmation.",
  },
  {
    item: "Meeting-type exclusion",
    status: "N/A",
    detail: "We never auto-join meetings and never record on your behalf. Capture comes from recordings you upload, or from live captions our Chrome extension reads only while you actively run it — there is no bot to exclude from HR or legal calls.",
  },
  {
    item: "Consent for all participants",
    status: "N/A",
    detail: "When you upload a recording, consent obligations stay with you as the account holder — Gauge never initiates capture. With the Chrome extension, the meeting's own consent applies to the captions it reads.",
  },
  {
    item: "Never \"use your data to improve our models\"",
    status: "Live",
    detail: "We do not train or fine-tune any model on your call data — that is our policy and our contract.",
  },
];

const subprocessors = [
  { vendor: "Vercel", purpose: "Application hosting, CDN, edge functions", region: "US", compliance: "SOC 2 Type 2, ISO 27001, DPA", status: "Active" },
  { vendor: "Neon", purpose: "PostgreSQL database (encrypted at rest)", region: "US (us-east-1)", compliance: "SOC 2 Type 2, ISO 27001, DPA", status: "Active" },
  { vendor: "Clerk", purpose: "Authentication and user identity", region: "US", compliance: "SOC 2 Type 2, DPA", status: "Active" },
  { vendor: "Groq", purpose: "Transcription (default)", region: "US", compliance: "SOC 2 Type 2, DPA", status: "Active" },
  { vendor: "OpenAI", purpose: "Transcription fallback and analysis", region: "US", compliance: "SOC 2 Type 2, DPA; data not used for training", status: "Active" },
  { vendor: "Upstash", purpose: "Rate limiting and queues", region: "US / EU", compliance: "SOC 2 Type 2, DPA", status: "Active" },
  { vendor: "HubSpot / Salesforce / Google Calendar & Drive / Slack / Teams", purpose: "CRM, calendar, docs, and messaging integrations", region: "US / EU (Slack: US)", compliance: "Customer-managed", status: "Only when you connect" },
];

function StatusBadge({ status }: { status: ChecklistItem["status"] }) {
  const styles: Record<ChecklistItem["status"], string> = {
    Live: "bg-green-50 text-green-700",
    Partial: "bg-blue-50 text-blue-700",
    Roadmap: "bg-amber-50 text-amber-700",
    "N/A": "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function SecurityPage() {
  return (
    <>
      <Nav />
      <main id="main" className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 pt-36 pb-20">
        <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-medium tracking-tight mb-2">Security</h1>
        <p className="text-gray-500 text-[13px] mb-10">Last updated: August 2026</p>

        <div className="space-y-8 text-[14px] text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">1. Data in Transit</h2>
            <p>
              All traffic between your browser and our servers is encrypted with TLS 1.2 or higher.
              Audio uploads and transcript fetches use the same encryption. HSTS is enforced
              with <code>max-age=31536000; includeSubDomains; preload</code>.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">2. Data at Rest</h2>
            <p>
              Production data is stored on Neon PostgreSQL (US East) with encryption at rest.
              API keys for the public REST API are stored as SHA-256 hashes; the raw key
              is shown to the user exactly once at creation time. We do not log or store raw
              API keys server-side after the user has seen them.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">3. Authentication</h2>
            <p>
              User authentication is delegated to Clerk. We do not store user passwords.
              Session management and CSRF protection are handled at the framework level.
              The public REST API supports scoped API keys with separate read / read_write
              scopes. Rate limits are enforced per key per scope. Team access uses
              Admin / Member roles.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">4. Content Security Policy</h2>
            <p>
              Authenticated app and API responses carry a Content Security Policy that locks
              <code> script-src</code>, <code>connect-src</code>, and <code>frame-ancestors</code>
              to a known allowlist. <code>frame-ancestors &#39;none&#39;</code> blocks clickjacking.
              <code> X-Content-Type-Options: nosniff</code> and <code>X-Frame-Options: DENY</code>
              are set on every response.
            </p>
          </section>

          <section className="border border-green-200 rounded-xl bg-green-50/50 p-5">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">5. Your data is never used for AI training</h2>
            <p>
              We do not use your call data to train or fine-tune any model — not yours, not
              anyone else&apos;s. This is our policy, and our Data Processing Agreement includes
              this commitment (available on request). Audio and transcripts are processed only
              to produce the notes you asked for.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">6. AI Provider Data Handling</h2>
            <p>
              Audio is transcribed with Groq (whisper-large-v3) by default, with OpenAI
              (Whisper) as fallback. Summaries and competitive intelligence are generated
              using OpenAI (with Groq fallback). Both providers process the data under their
              standard data-processing terms; OpenAI does not train on API data, and we never
              train on your call data ourselves.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">7. Sub-processors</h2>
            <p className="mb-4">
              We only use sub-processors to run the product you asked for. The full inventory
              of sub-processors currently in use is below, and we notify you 30 days before
              any new sub-processor touches your personal data — via in-app banner and email —
              with the right to object.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <caption className="sr-only">
                  Sub-processor inventory: vendor, purpose, region, and status
                </caption>
                <thead>
                  <tr className="border-b border-gray-200">
                    <th scope="col" className="text-left py-2.5 pr-3 text-gray-500 font-medium">Vendor</th>
                    <th scope="col" className="text-left py-2.5 pr-3 text-gray-500 font-medium">Purpose</th>
                    <th scope="col" className="text-left py-2.5 pr-3 text-gray-500 font-medium">Region</th>
                    <th scope="col" className="text-left py-2.5 text-gray-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subprocessors.map((row) => (
                    <tr key={row.vendor} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-gray-900">{row.vendor}</td>
                      <td className="py-2.5 pr-3 text-gray-600">{row.purpose}</td>
                      <td className="py-2.5 pr-3 text-gray-500">{row.region}</td>
                      <td className="py-2.5 text-gray-500">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12px] text-gray-500">
              Compliance attestations per vendor are tracked in our vendor register and DPA
              and available on request.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">8. Enterprise security checklist</h2>
            <p className="mb-4">
              This is the security checklist enterprise buyers run when evaluating a
              conversation-intelligence tool. Every item below has an honest status — we
              don&apos;t present aspiration as fact.
            </p>
            <ul className="space-y-3">
              {checklist.map((entry) => (
                <li key={entry.item} className="flex flex-col sm:flex-row sm:items-start gap-2 border-b border-gray-100 pb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[13px] font-medium text-gray-900">{entry.item}</span>
                      <StatusBadge status={entry.status} />
                    </div>
                    <p className="text-[12px] text-gray-500 leading-relaxed">{entry.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">9. GDPR & Data Export</h2>
            <p>
              Users in the EU can request a full export of their account data, including
              every call, transcript, action item, decision, next step, and comment. Exports
              are protected by a token that expires 7 days after it is issued, and the download
              link is sent only to the requesting account. Account deletion is a two-step
              confirm, followed by a 7-day grace period and hard delete.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">10. Reporting a Vulnerability</h2>
            <p>
              If you have found a security issue, please email{" "}
              <a className="text-gray-900 underline" href="mailto:security@usegauge.com">
                security@usegauge.com
              </a>
              . We aim to acknowledge reports within 48 hours and run a coordinated
              disclosure process.
            </p>
          </section>
        </div>
      </div>      </main>
    </>
  );
}
