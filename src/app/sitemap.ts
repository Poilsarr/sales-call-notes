import type { MetadataRoute } from "next";

const SITE_URL = "https://callnotepro.com";

/**
 * Dynamic sitemap.xml — public marketing pages only.
 * Gated pages (/dashboard, /settings, /team, /integrations, /billing,
 * /app) are excluded because they're behind Clerk auth and not
 * indexable.
 *
 * Last reviewed when adding a new public route? Update the array
 * below + bump the <lastmod> for changed pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const routes = [
    { path: "/",          priority: 1.0,  changeFrequency: "weekly" as const },
    { path: "/pricing",   priority: 0.9,  changeFrequency: "weekly" as const },
    { path: "/features",  priority: 0.9,  changeFrequency: "weekly" as const },
    { path: "/integrations-marketing", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/demo",      priority: 0.8,  changeFrequency: "monthly" as const },
    { path: "/api-docs",  priority: 0.6,  changeFrequency: "monthly" as const },
    { path: "/api-docs/v1", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/status",    priority: 0.5,  changeFrequency: "daily" as const },
    { path: "/privacy",   priority: 0.3,  changeFrequency: "yearly" as const },
    { path: "/terms",     priority: 0.3,  changeFrequency: "yearly" as const },
    { path: "/refund",    priority: 0.3,  changeFrequency: "yearly" as const },
    { path: "/security",  priority: 0.5,  changeFrequency: "monthly" as const },
    { path: "/vendors",   priority: 0.4,  changeFrequency: "yearly" as const },
    { path: "/dpa",       priority: 0.4,  changeFrequency: "yearly" as const },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: lastWeek,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}