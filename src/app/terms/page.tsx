"use client";

import Nav from "@/components/nav";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-32 pb-20">
        <h1 className="text-3xl font-medium tracking-tight mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-sm text-gray-500 leading-relaxed">
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Axion Studio (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">2. Description of Service</h2>
            <p>Axion Studio provides digital design and development services including brand identity, web design, UI/UX, and visual content. Project scope, deliverables, and timelines are defined in individual project agreements.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">3. Client Responsibilities</h2>
            <p>You are responsible for providing timely feedback, approvals, and any materials required for project completion. Delays caused by client unavailability may affect project timelines.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">4. Payment & Billing</h2>
            <p>Project fees are outlined in your project agreement. Invoices are due within 30 days unless otherwise specified. Late payments may result in project suspension.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">5. Intellectual Property</h2>
            <p>Upon full payment, all intellectual property rights for deliverables are transferred to the client. Axion Studio retains the right to display completed work in our portfolio.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p>Axion Studio is provided &quot;as is&quot; without warranty. We are not liable for damages arising from use of the Service, including but not limited to design errors or data loss.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">7. Changes</h2>
            <p>We may update these terms at any time. Continued use after changes constitutes acceptance. We will notify clients of material changes via email.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">8. Contact</h2>
            <p>Questions? Email us at <a href="mailto:hello@axionstudio.com" className="text-[#F26522] hover:underline">hello@axionstudio.com</a>.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
