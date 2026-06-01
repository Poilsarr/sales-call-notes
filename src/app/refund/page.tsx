"use client";

import Nav from "@/components/nav";

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-linear-black text-white">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <h1 className="text-3xl font-medium tracking-tight mb-2">Refund Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-sm text-white/60 leading-relaxed">
          <section>
            <h2 className="text-lg font-medium text-white mb-3">1. Subscription Refunds</h2>
            <p>You may cancel your subscription at any time. Upon cancellation, you retain access to paid features until the end of the current billing period. We do not provide prorated refunds for partial months.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">2. New Subscriptions</h2>
            <p>If you cancel within 14 days of your initial subscription purchase, you may request a full refund. Contact us at <a href="mailto:refunds@callnotepro.com" className="text-linear-indigo hover:underline">refunds@callnotepro.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">3. Annual Plans</h2>
            <p>Annual subscriptions cancelled within 30 days of purchase are eligible for a full refund. After 30 days, refunds are prorated for the remaining months.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">4. Service Issues</h2>
            <p>If you experience a technical issue that prevents use of the Service and we cannot resolve it within a reasonable timeframe, you may request a refund for the affected period.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">5. Processing</h2>
            <p>Refunds are processed through Paddle and typically appear within 5-10 business days. Paddle handles all payment processing and refund transactions.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">6. Contact</h2>
            <p>Refund requests: <a href="mailto:refunds@callnotepro.com" className="text-linear-indigo hover:underline">refunds@callnotepro.com</a></p>
          </section>
        </div>
      </div>
    </main>
  );
}
