"use client";

import Nav from "@/components/nav";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-32 pb-20">
        <h1 className="text-3xl font-medium tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-sm text-gray-500 leading-relaxed">
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">1. What We Collect</h2>
            <p>We collect account information (email, name), project-related files and materials, communication records, and basic usage analytics (page views, feature usage).</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">2. How We Use Data</h2>
            <p>Client materials are used solely for project delivery. We do not use client data to train AI models. Project files are stored securely for the duration of our engagement.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">3. Data Storage</h2>
            <p>Data is stored securely on industry-standard infrastructure. We retain project files and communication records for the duration of your account and for a reasonable period thereafter.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">4. Third-Party Services</h2>
            <p>We use: Clerk (authentication), Vercel (hosting), Paddle (payment processing), and various design tools (Figma, Webflow, etc.) under their respective privacy policies.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">5. Data Sharing</h2>
            <p>We do not sell your data. We may share data with third-party services only as necessary to provide the Service (e.g., hosting with Vercel). We may disclose data if required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">6. Your Rights</h2>
            <p>You may export, delete, or request a copy of your data anytime. Contact us at <a href="mailto:hello@axionstudio.com" className="text-[#F26522] hover:underline">hello@axionstudio.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">7. Security</h2>
            <p>We use encryption in transit (TLS) and at rest. Access to production data is restricted. We run regular security audits.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">8. Contact</h2>
            <p>Privacy concerns: <a href="mailto:hello@axionstudio.com" className="text-[#F26522] hover:underline">hello@axionstudio.com</a></p>
          </section>
        </div>
      </div>
    </main>
  );
}
