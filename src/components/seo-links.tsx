import Link from "next/link";

const LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/vs/otter-ai", label: "Gauge vs Otter.ai" },
  { href: "/vs/fireflies", label: "Gauge vs Fireflies" },
  { href: "/vs/gong", label: "Gauge vs Gong" },
  { href: "/vs/fathom", label: "Gauge vs Fathom" },
  { href: "/vs/tldv", label: "Gauge vs tl;dv" },
  { href: "/otter-alternative", label: "Otter.ai alternative" },
  { href: "/api-docs", label: "API documentation" },
  { href: "/extension", label: "Chrome extension" },
  { href: "/demo", label: "Live demo" },
];

/**
 * SeoLinks — related-pages directory above the footer.
 *
 * Every href targets an existing route (verified: src/test/footer-links.test.ts
 * convention — each resolves to a page.tsx under src/app). No new routes.
 *
 * Server component — no JS shipped.
 */
export function SeoLinks() {
  return (
    <section
      aria-label="Related pages"
      data-track-section="related"
      className="bg-white border-t border-gray-200"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-gray-500 font-medium mb-6">
          Keep exploring
        </h2>
        <nav aria-label="Related">
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[13px] text-gray-600 hover:text-gray-900 hover:underline underline-offset-2"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}

export default SeoLinks;
