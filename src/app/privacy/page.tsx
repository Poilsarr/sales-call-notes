"use client";

import Nav from "@/components/nav";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 pt-36 pb-20">
        <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-medium tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-[13px] mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-[14px] text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">1. What We Collect</h2>
            <p>We collect: account information (email, name), uploaded audio files, transcriptions and analysis results, and basic usage analytics (page views, feature usage).</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">2. How We Use Data</h2>
            <p>Audio files are processed to generate transcriptions, summaries, and insights. We do not use your call data to train or improve AI models. Transcripts are stored for your account history.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">3. Data Storage</h2>
            <p>Data is stored securely on Neon PostgreSQL (US East) and OpenAI for processing. We retain transcripts and analysis for the duration of your account. Audio files are deleted after processing.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">4. Third-Party Services</h2>
            <p>We use: OpenAI (transcription), Neon (database), Vercel (hosting), Upstash (rate limiting), Paddle (payment processing), Clerk (authentication). Each service has its own privacy policy.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">5. Chrome Extension</h2>
            <p>
              Our Chrome extension (Manifest v3, available on the Chrome Web Store as
              &ldquo;Gauge — Meeting Notes&rdquo;) runs only on
              <code className="px-1 py-0.5 mx-1 rounded bg-gray-100 text-[12px]">meet.google.com</code>
              and on our own dashboard page
              (<code className="px-1 py-0.5 mx-1 rounded bg-gray-100 text-[12px]">usegauge.vercel.app</code>).
            </p>
            <p className="mt-3">
              <strong>What the extension accesses:</strong> on Google Meet pages,
              it reads meeting captions (the live transcript text) so it can save
              your call when you end the meeting. It does not record audio, video,
              or your screen. It does not access any other Google account data,
              cookies, or files.
            </p>
            <p className="mt-3">
              <strong>What the extension sends to our servers:</strong> the
              captured caption text, the meeting title, and your auth session
              (to attribute the call to your account). The data flow is:
              your Google Meet tab → extension →
              <code className="px-1 py-0.5 mx-1 rounded bg-gray-100 text-[12px]">https://api.usegauge.com</code>
              → your dashboard.
            </p>
            <p className="mt-3">
              <strong>Permissions explained:</strong>
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><code className="px-1 py-0.5 rounded bg-gray-100 text-[12px]">storage</code> — saves your auth session and the in-progress transcript locally so we can recover if the browser crashes.</li>
              <li><code className="px-1 py-0.5 rounded bg-gray-100 text-[12px]">activeTab</code> — only runs on the Meet tab you currently have open; no background tab access.</li>
              <li><code className="px-1 py-0.5 rounded bg-gray-100 text-[12px]">alarms</code> — used to retry failed uploads if your connection drops.</li>
              <li><code className="px-1 py-0.5 rounded bg-gray-100 text-[12px]">identity</code> — Google sign-in for users who link Meet account (optional).</li>
            </ul>
            <p className="mt-3">
              <strong>Data ownership:</strong> Google Meet captions are
              Google&rsquo;s data and remain governed by the
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#F26522] hover:underline ml-1">Google Privacy Policy</a>.
              The extension stores them only long enough to deliver the
              transcription to your account; nothing is shared with third
              parties beyond the services listed in section 4.
            </p>
            <p className="mt-3">
              You can revoke the extension at any time in
              <code className="px-1 py-0.5 mx-1 rounded bg-gray-100 text-[12px]">chrome://extensions/</code>.
            </p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">6. Data Sharing</h2>
            <p>We do not sell your data. We may share data with third-party services only as necessary to provide the Service (e.g., processing audio with OpenAI). We may disclose data if required by law.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <p>You may export, delete, or request a copy of your data anytime. Contact us at <a href="mailto:privacy@usegauge.com" className="text-[#F26522] hover:underline">privacy@usegauge.com</a>.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">8. Security</h2>
            <p>We use encryption in transit (TLS) and at rest. Access to production data is restricted. We run regular security audits.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">9. Contact</h2>
            <p>Privacy concerns: <a href="mailto:privacy@usegauge.com" className="text-[#F26522] hover:underline">privacy@usegauge.com</a></p>
          </section>
        </div>
      </div>
    </main>
  );
}
