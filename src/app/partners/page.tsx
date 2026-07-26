import Link from "next/link";
import { ArrowRight, DollarSign, Users, TrendingUp, Gift, Rocket, HelpCircle } from "lucide-react";
import GaugeLogo from "@/components/gauge-logo";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partners & Affiliates — Earn 30% Recurring Commission | Gauge",
  description:
    "Join the Gauge partner program. Earn 30% recurring commission on every referral. Built for sales coaches, consultants, and content creators.",
};

const benefits = [
  {
    icon: DollarSign,
    title: "30% recurring commission",
    desc: "Earn 30% of every dollar your referral pays — every month, forever. No caps, no expiry.",
  },
  {
    icon: TrendingUp,
    title: "Lifetime tracking",
    desc: "Once someone signs up under your link, you earn on them for the lifetime of their account.",
  },
  {
    icon: Gift,
    title: "30-day cookie window",
    desc: "Referrals who click your link and sign up within 30 days still credit to you.",
  },
  {
    icon: Users,
    title: "Marketing assets included",
    desc: "Banners, copy templates, landing pages, and co-branded decks — we hand you everything.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Apply",
    desc: "Fill out the short partner form. Approval takes under 24 hours.",
  },
  {
    step: "02",
    title: "Get your unique link",
    desc: "We'll issue a referral link and a partner dashboard with real-time tracking.",
  },
  {
    step: "03",
    title: "Share & earn",
    desc: "Drop the link in your content, community, or client work. Commissions auto-pay monthly.",
  },
];

const faqs = [
  {
    q: "Who is this program for?",
    a: "Sales coaches, RevOps consultants, podcasters, newsletter writers, and community builders who recommend tools to sales teams.",
  },
  {
    q: "When do I get paid?",
    a: "Monthly via Stripe or PayPal, with a minimum payout threshold of $50. We pay net-30 after the end of each month.",
  },
  {
    q: "Is there a cap on earnings?",
    a: "None. Top partners earn $5,000+/month. We want you to win as much as we do.",
  },
  {
    q: "Do I need to be a paying customer to refer?",
    a: "No. Anyone can apply. You don't need an active Gauge subscription to be a partner.",
  },
  {
    q: "How do I track my referrals?",
    a: "You'll get a partner dashboard with live clicks, signups, conversions, and earnings — all in one place.",
  },
];

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white">
      {/* HEADER */}
      <header className="border-b border-white/5 sticky top-0 bg-[#0a0a0b]/90 backdrop-blur z-10">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <GaugeLogo size={26} dark />
            <span className="text-[14px] font-semibold tracking-tight">Gauge</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-[13px] text-white/60 hover:text-white transition-colors hidden sm:inline">
              Pricing
            </Link>
            <Link href="/features" className="text-[13px] text-white/60 hover:text-white transition-colors hidden sm:inline">
              Features
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[12px] rounded-full pl-4 pr-1.5 py-1.5"
            >
              <span>Start free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-24 sm:py-32">
          <div className="max-w-3xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#F26522] mb-6">
              Partner Program
            </p>
            <h1 className="text-[clamp(36px,6vw,72px)] font-semibold tracking-tight leading-[0.95] text-white mb-6">
              Earn 30% recurring
              <br />
              commission.
            </h1>
            <p className="text-[15px] leading-[1.6] text-white/60 max-w-xl">
              Recommend Gauge to your network. Get paid 30% of every dollar they spend — every month, for the lifetime of their account. No caps. No expiry.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/partners/apply"
                className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-1.5 py-2.5 font-medium"
              >
                <span>Become a Partner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="#how-it-works"
                className="text-[13px] text-white/60 hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                <span>How it works</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-28">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#F26522] mb-4">
            Why partners choose Gauge
          </p>
          <h2 className="text-[clamp(28px,4vw,44px)] font-semibold tracking-tight leading-[1.05] text-white mb-12">
            The most generous affiliate program in sales intelligence.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {benefits.map((b, i) => (
              <div key={i} className="bg-[#0a0a0b] p-7 sm:p-9">
                <div className="w-10 h-10 rounded-lg bg-[#F26522]/10 flex items-center justify-center mb-5">
                  <b.icon className="w-5 h-5 text-[#F26522]" />
                </div>
                <h3 className="text-[16px] font-semibold tracking-tight text-white mb-2">{b.title}</h3>
                <p className="text-[13.5px] leading-[1.6] text-white/55">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-28">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#F26522] mb-4">
            How it works
          </p>
          <h2 className="text-[clamp(28px,4vw,44px)] font-semibold tracking-tight leading-[1.05] text-white mb-12">
            Three steps to recurring revenue.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {howItWorks.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 sm:p-8"
              >
                <p className="text-[11px] font-mono text-[#F26522] mb-6">{s.step}</p>
                <h3 className="text-[17px] font-semibold tracking-tight text-white mb-2">{s.title}</h3>
                <p className="text-[13.5px] leading-[1.6] text-white/55">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#F26522] mb-4">
                FAQ
              </p>
              <h2 className="text-[clamp(24px,3.2vw,36px)] font-semibold tracking-tight leading-[1.05] text-white">
                Questions, answered.
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-px bg-white/5 rounded-2xl overflow-hidden">
              {faqs.map((f, i) => (
                <details
                  key={i}
                  className="bg-[#0a0a0b] p-6 sm:p-7 group cursor-pointer [&_svg]:transition-transform [&[open]>div>svg]:rotate-45"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-[14.5px] font-medium text-white">{f.q}</h3>
                    <HelpCircle className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
                  </div>
                  <p className="text-[13.5px] leading-[1.6] text-white/55 mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-24 sm:py-32">
          <div className="rounded-3xl bg-gradient-to-br from-[#F26522]/10 to-transparent border border-[#F26522]/20 p-10 sm:p-14 text-center">
            <Rocket className="w-10 h-10 text-[#F26522] mx-auto mb-6" />
            <h2 className="text-[clamp(26px,3.6vw,42px)] font-semibold tracking-tight leading-[1.05] text-white mb-4">
              Ready to start earning?
            </h2>
            <p className="text-[14px] leading-[1.6] text-white/55 max-w-lg mx-auto mb-9">
              Apply today. Get approved within 24 hours. Start earning on your first referral this week.
            </p>
              <Link
                href="/partners/apply"
                className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[14px] rounded-full pl-6 pr-2.5 py-3 font-medium"
              >
                <span>Become a Partner</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
