import { User, Workflow, LineChart } from "lucide-react";

const segments = [
  {
    icon: User,
    title: "Solo SDRs",
    bullets: [
      "Spend less time writing notes and more time on the next call.",
      "Get CRM-ready summaries that actually match your workflow.",
      "Start free and only upgrade when your volume grows.",
    ],
  },
  {
    icon: Workflow,
    title: "RevOps teams",
    bullets: [
      "Keep deal data clean with automatic CRM exports.",
      "Enforce consistent follow-up across every rep.",
      "Track what was actually promised on each call.",
    ],
  },
  {
    icon: LineChart,
    title: "Sales managers",
    bullets: [
      "Review every call without listening to every minute.",
      "Spot coaching moments from talk ratio and sentiment.",
      "Coach from real data, not memory.",
    ],
  },
];

export default function PricingSocialProof() {
  return (
    <section className="py-12 sm:py-16 px-5 sm:px-8 lg:px-12">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center mb-10">
          <div className="eyebrow inline-flex items-center gap-2 mb-3">
            <LineChart size={12} /> Built for revenue teams
          </div>
          <h3 className="text-[clamp(1.25rem,3vw,1.75rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
            One tool across every seat
          </h3>
          <p className="text-[13px] text-gray-500 max-w-md mx-auto">
            Gauge is designed for the people who actually live in sales calls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {segments.map((seg) => (
            <div key={seg.title} className="doppel-outer h-full">
              <div className="doppel-inner p-6 h-full flex flex-col">
                <div className="w-10 h-10 rounded-full bg-[#F26522]/10 flex items-center justify-center mb-4">
                  <seg.icon size={20} className="text-[#F26522]" />
                </div>
                <h4 className="text-[14px] font-semibold text-gray-900 mb-3">{seg.title}</h4>
                <ul className="space-y-2.5 flex-1">
                  {seg.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-gray-500 leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-[#F26522] mt-2 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[12px] text-gray-400 text-center mt-8">
          Customer testimonials are coming as we collect real feedback. No fake quotes here.
        </p>
      </div>
    </section>
  );
}
