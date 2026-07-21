
import Nav from "@/components/nav";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Gauge",
  description: "Terms of Service for using Gauge.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 pt-36 pb-20">
        <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-medium tracking-tight mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-[13px] mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-[14px] text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Gauge (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>Gauge provides AI-powered sales call transcription, summarization, and analytics. We process audio files you upload and return transcriptions, summaries, and insights.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">3. User Responsibilities</h2>
            <p>You are responsible for all content you upload. You must ensure you have the necessary consent to record and analyze calls. You may not use the Service for any unlawful purpose.</p>
            <p className="mt-3">
              <strong>Browser extension:</strong> by installing our Chrome extension,
              you confirm that you have consent from all meeting participants to
              capture the live captions from any meeting where the extension is
              active. The extension is a convenience tool for users who already
              have the right to record the meeting; it does not grant any
              recording rights you would not otherwise have.
            </p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">4. Subscription & Billing</h2>
            <p>Paid plans are billed monthly via Paddle. You may cancel anytime. Refunds are handled per our refund policy. Prices may change with 30 days notice.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">5. Data Processing</h2>
            <p>Audio files are processed temporarily for transcription and analysis. We do not use your call data to train AI models. See our Privacy Policy for details.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p>Gauge is provided &quot;as is&quot; without warranty. We are not liable for damages arising from use of the Service, including but not limited to transcription errors or data loss.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">7. Changes</h2>
            <p>We may update these terms at any time. Continued use after changes constitutes acceptance. We will notify users of material changes via email.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p>Questions? Email us at <a href="mailto:legal@usegauge.com" className="text-[#F26522] hover:underline">legal@usegauge.com</a>.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
