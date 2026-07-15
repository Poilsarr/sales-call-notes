"use client";

import Nav from "@/components/nav";

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 pt-36 pb-20">
        <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-medium tracking-tight mb-2">Refund Policy</h1>
        <p className="text-gray-400 text-[13px] mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-[14px] text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">1. Free Tier</h2>
            <p>The free tier has no associated costs. You can use it indefinitely at no charge. No refunds are applicable.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">2. Paid Plans</h2>
            <p>All paid plans are billed monthly via Paddle. You may cancel your subscription at any time. Upon cancellation, you will retain access to paid features until the end of your current billing period.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">3. Refunds</h2>
            <p>We offer a 14-day money-back guarantee on all paid plans. If you are not satisfied, contact us within 14 days of your initial payment for a full refund. Refunds are processed through Paddle within 5-10 business days.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">4. Partial Refunds</h2>
            <p>Partial refunds may be issued at our discretion for unused portions of annual subscriptions. Monthly subscriptions are not eligible for partial refunds beyond the 14-day guarantee period.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">5. Enterprise Plans</h2>
            <p>Enterprise plans with custom pricing are subject to the refund terms specified in your agreement. Contact your account manager for details.</p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">6. Contact</h2>
            <p>For refund requests, email <a href="mailto:billing@usegauge.com" className="text-[#F26522] hover:underline">billing@usegauge.com</a> with your account email and reason for cancellation.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
