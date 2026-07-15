"use client";

import Nav from "@/components/nav";

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 pt-36 pb-20">
        <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-medium tracking-tight mb-2">Security</h1>
        <p className="text-gray-400 text-[13px] mb-10">Last updated: June 2026</p>

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
              API keys for the public REST API are stored as HMAC-SHA256 hashes; the raw key
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
              / admin scopes. Rate limits are enforced per key per scope.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">4. Content Security Policy</h2>
            <p>
              Every response carries a strict CSP that locks <code>script-src</code>,
              <code> connect-src</code>, and <code>frame-ancestors</code> down to a
              known allowlist. <code>frame-ancestors none</code> blocks clickjacking.
              <code> X-Content-Type-Options: nosniff</code> and <code>X-Frame-Options: DENY</code>
              are set on every response.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">5. AI Provider Data Handling</h2>
            <p>
              Audio is sent to OpenAI (Whisper) and Groq for transcription. Summaries and
              competitive intelligence are generated using OpenAI. Both providers process
              the data under their standard data-processing terms; we do not use your call
              data to train or fine-tune any model.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">6. GDPR & Data Export</h2>
            <p>
              Users in the EU can request a full export of their account data, including
              every call, transcript, action item, and integration. Exports are signed with
              an HMAC-SHA256 token that expires after 60 seconds and is single-use.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">7. Reporting a Vulnerability</h2>
            <p>
              If you have found a security issue, please email{" "}
              <a className="text-gray-900 underline" href="mailto:security@usegauge.com">
                security@usegauge.com
              </a>
              . We respond within 48 hours and run a coordinated disclosure process.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
