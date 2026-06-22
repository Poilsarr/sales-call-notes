import Link from "next/link";
import Nav from "@/components/nav";
import RevealObserver from "@/components/reveal-observer";
import { Sparkles, CheckCircle, ArrowRight, Zap } from "lucide-react";

const plans = [
  {
    name: "Free", price: "$0", period: "forever",
    desc: "Perfect for solo SDRs getting started.",
    features: ["300 transcription minutes/mo", "AI summaries & action items", "Speaker identification", "Basic search & history", "JSON export", "Community support"],
    cta: "Get Started", popular: false,
  },
  {
    name: "Pro", price: "$9", period: "/month per user",
    desc: "For serious SDRs who need CRM integration.",
    features: ["1,200 transcription minutes/mo", "Unlimited AI summaries", "CRM export (HubSpot, Salesforce)", "Advanced analytics dashboard", "Priority support", "90-minute call limit", "Team workspace (up to 5)"],
    cta: "Start Free Trial", popular: true,
  },
  {
    name: "Business", price: "$29", period: "/month per user",
    desc: "For sales teams scaling up.",
    features: ["6,000 transcription minutes/mo", "Microsoft Teams integration", "Custom AI workflows", "Team analytics & coaching", "Unlimited file imports", "4-hour call limit", "Admin controls & usage logs", "API access"],
    cta: "Contact Sales", popular: false,
  },
  {
    name: "Enterprise", price: "Custom", period: "",
    desc: "For organizations with advanced needs.",
    features: ["Unlimited transcription", "SSO / SAML 2.0", "HIPAA compliance", "Custom integrations", "Dedicated account manager", "On-premise deployment", "SLA guarantee", "Custom AI model training"],
    cta: "Contact Sales", popular: false, enterprise: true,
  },
];

const comparison = [
  ["Free tier minutes", "300/mo", "300/mo", "800/mo"],
  ["Pro price", "$9/user/mo", "$8.33/user/mo", "$10/user/mo"],
  ["Business price", "$29/user/mo", "$19.99/user/mo", "$19/user/mo"],
  ["AI credits system", "No credits", "Limits on free", "Yes (20-50 pool)"],
  ["Local AI processing", "Yes", "No", "No"],
  ["Speaker diarization", "Yes", "Yes", "Yes"],
  ["CRM sync", "HubSpot, Salesforce", "Enterprise only", "HubSpot, Salesforce"],
  ["Microsoft Teams", "Yes", "Yes", "Yes"],
  ["SSO / SAML", "Enterprise", "Enterprise", "Enterprise"],
  ["API access", "Business+", "Enterprise", "Business+"],
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />
      <RevealObserver />

      {/* Hero */}
      <section className="pt-36 pb-16 sm:pt-40 sm:pb-20 px-5 sm:px-8 lg:px-12 bg-[#EFEFEF] overflow-hidden">
        <div className="max-w-[1440px] mx-auto text-center">
          <div className="eyebrow inline-flex items-center gap-2 mb-6 reveal">
            <Sparkles size={12} /> Simple, transparent pricing
          </div>
          <h1 className="text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-4">
            Free for SDRs.<br />
            <span className="text-gray-400">Scale when you need to.</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-[14px]">
            No hidden fees. No AI credit traps. Start free, upgrade only when your team grows.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-12 sm:py-16 lg:py-20 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, i) => (
            <div key={i} className="reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className={`doppel-outer h-full flex flex-col ${plan.popular ? "ring-[#F26522]/30 ring-2" : ""}`}>
                <div className={`doppel-inner p-6 sm:p-8 h-full flex flex-col relative ${plan.popular ? "bg-[#F26522]/[0.02]" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#F26522] text-[10px] font-bold uppercase tracking-[0.15em] text-white whitespace-nowrap">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-[16px] font-semibold tracking-tight mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[clamp(1.5rem,3vw,2.5rem)] font-semibold tracking-tight">{plan.price}</span>
                      <span className="text-[13px] text-gray-400">{plan.period}</span>
                    </div>
                    <p className="text-[12px] text-gray-500 mt-2">{plan.desc}</p>
                  </div>
                  <div className="flex-1 space-y-2.5 mb-8">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-start gap-2 text-[12px] text-gray-600">
                        <CheckCircle size={14} className="text-[#F26522] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  {plan.enterprise ? (
                    <a href="mailto:sales@callnotepro.com?subject=Enterprise%20Plan%20Inquiry"
                      className="block w-full text-center py-3 rounded-full text-[12px] font-semibold bg-white text-gray-900 border border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-all duration-300">
                      {plan.cta}
                    </a>
                  ) : (
                    <Link href="/sign-up"
                      className={`block w-full text-center py-3 rounded-full text-[12px] font-semibold transition-all duration-300 ${
                        plan.popular
                          ? "bg-[#F26522] text-white hover:bg-[#e05a1a] border border-transparent"
                          : "bg-white text-gray-900 border border-gray-300 hover:border-gray-900 hover:bg-gray-50"
                      }`}>
                      {plan.cta}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="pb-16 sm:pb-20 lg:pb-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto reveal">
          <div className="doppel-outer">
            <div className="doppel-inner p-6 sm:p-8">
              <h3 className="text-[15px] font-semibold tracking-tight mb-6 text-center">Compare to competitors</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 pr-4 text-gray-500 font-medium">Feature</th>
                      <th className="text-center py-3 px-4 text-gray-900 font-semibold">CallNote Pro</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">Otter.ai</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">Fireflies.ai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3 pr-4 text-gray-600">{row[0]}</td>
                        <td className="text-center py-3 px-4 text-[#F26522] font-medium">{row[1]}</td>
                        <td className="text-center py-3 px-4 text-gray-400">{row[2]}</td>
                        <td className="text-center py-3 px-4 text-gray-400">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-[1440px] mx-auto mt-8 reveal">
          <div className="doppel-outer group">
            <div className="doppel-inner p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="eyebrow inline-flex items-center gap-2 mb-5">
                  <Zap size={12} /> Start today
                </div>
                <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3">
                  Ready to save hours every week?
                </h2>
                <p className="text-gray-500 mb-8 text-[14px]">Join SDRs who cut their note-taking time by 80%.</p>
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300"
                >
                  <span className="flex flex-col overflow-hidden h-[20px]">
                    <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                      Get started free
                    </span>
                    <span className="leading-[20px]">Get started free</span>
                  </span>
                  <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                    <ArrowRight size={14} className="text-[#F26522]" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
