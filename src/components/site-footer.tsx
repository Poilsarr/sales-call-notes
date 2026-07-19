import Link from "next/link";
import GaugeLogo from "@/components/gauge-logo";

/**
 * Site footer — 4-column link directory + status badge + legal row.
 * Lives in its own component so pricing / features / app pages
 * can adopt the same chrome later.
 *
 * Server component — no JS shipped.
 */

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/integrations", label: "Integrations" },
      { href: "/pricing", label: "Pricing" },
      { href: "/demo", label: "Live demo" },
    ],
  },
  {
    title: "Use cases",
    links: [
      { href: "/features#core-platform", label: "Sales call transcription" },
      { href: "/features#analytics-intelligence", label: "Competitive intelligence" },
      { href: "/features#enterprise-security", label: "Local processing" },
      { href: "/integrations", label: "HubSpot + Salesforce sync" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/api-docs", label: "API documentation" },
      { href: "/api/v1/keys", label: "API keys" },
      { href: "/blog", label: "Blog" },
      { href: "mailto:hello@usegauge.com", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Notice" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/refund", label: "Refund Policy" },
      { href: "/security", label: "Security" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-[#0a0a0b] text-white/60">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand column — spans 1, sits wider */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <GaugeLogo className="text-white/60 w-6 h-6" size={24} />
              <span className="text-white text-[14px] font-semibold tracking-tight">
                Gauge
              </span>
            </Link>
            <p className="text-[12.5px] leading-relaxed text-white/50 max-w-[220px]">
              AI sales call notes, action items, and competitive-intel
              alerts. Built for solo SDRs and small RevOps teams.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-white/40 font-mono uppercase tracking-wider">
                All systems operational
              </span>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-medium mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-white/70 hover:text-white transition-colors duration-200"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-[11px] text-white/30">
            © {new Date().getFullYear()} Gauge. All rights reserved.
          </div>
          <div className="flex items-center gap-5 text-[11px] text-white/40">
            <span>Made for SDRs who hate note-taking.</span>
            <a
              href="https://status.usegauge.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70 transition-colors"
            >
              status →
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
