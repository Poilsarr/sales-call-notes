"use client";

import Nav from "@/components/nav";

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-32 pb-20">
        <h1 className="text-3xl font-medium tracking-tight mb-2">Refund Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-sm text-gray-500 leading-relaxed">
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">1. Project Deposits</h2>
            <p>A 50% deposit is required to begin work. If you cancel before design work begins, your deposit is fully refundable. Once design work has commenced, the deposit is non-refundable.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">2. Milestone Payments</h2>
            <p>Milestone payments are due upon approval of deliverables. Approved and delivered work is non-refundable. If you are unsatisfied, we will work with you to revise deliverables until they meet the approved scope.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">3. Retainer Services</h2>
            <p>Monthly retainers may be cancelled with 30 days notice. Unused retainer hours are not refundable but may be credited to the following month.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">4. Service Issues</h2>
            <p>If you experience a technical issue that prevents use of deliverables and we cannot resolve it within a reasonable timeframe, you may request a refund for the affected deliverables.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">5. Processing</h2>
            <p>Refunds are processed within 5-10 business days of approval. Paddle handles all payment processing and refund transactions.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">6. Contact</h2>
            <p>Refund requests: <a href="mailto:hello@axionstudio.com" className="text-[#F26522] hover:underline">hello@axionstudio.com</a></p>
          </section>
        </div>
      </div>
    </main>
  );
}
