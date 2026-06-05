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
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">5. Data Sharing</h2>
            <p>We do not sell your data. We may share data with third-party services only as necessary to provide the Service (e.g., processing audio with OpenAI). We may disclose data if required by law.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <p>You may export, delete, or request a copy of your data anytime. Contact us at <a href="mailto:privacy@callnotepro.com" className="text-[#F26522] hover:underline">privacy@callnotepro.com</a>.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">7. Security</h2>
            <p>We use encryption in transit (TLS) and at rest. Access to production data is restricted. We run regular security audits.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p>Privacy concerns: <a href="mailto:privacy@callnotepro.com" className="text-[#F26522] hover:underline">privacy@callnotepro.com</a></p>
          </section>
        </div>
      </div>
    </main>
  );
}
