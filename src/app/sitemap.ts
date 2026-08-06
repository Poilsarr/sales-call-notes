import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://usegauge.com";

export const revalidate = 3600;

/**
 * Dynamic sitemap.xml — public marketing pages only.
 * Gated pages (/dashboard, /settings, /team, /integrations, /billing,
 * /app) are excluded because they're behind Clerk auth and not
 * indexable.
 *
 * Last reviewed when adding a new public route? Update the array
 * below + bump the <lastmod> for changed pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const routes = [
    { path: "/",          priority: 1.0,  changeFrequency: "weekly" as const },
    { path: "/pricing",   priority: 0.9,  changeFrequency: "weekly" as const },
    { path: "/features",  priority: 0.9,  changeFrequency: "weekly" as const },
    { path: "/vs/otter-ai", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/otter-alternative", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/vs/fireflies", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/vs/fathom",  priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/vs/gong",    priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/vs/tldv",    priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/integrations-marketing", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/demo",      priority: 0.8,  changeFrequency: "monthly" as const },
    { path: "/api-docs",  priority: 0.6,  changeFrequency: "monthly" as const },
    { path: "/api-docs/v1", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/status",    priority: 0.5,  changeFrequency: "daily" as const },
    { path: "/privacy",   priority: 0.3,  changeFrequency: "yearly" as const },
    { path: "/terms",     priority: 0.3,  changeFrequency: "yearly" as const },
    { path: "/refund",    priority: 0.3,  changeFrequency: "yearly" as const },
    { path: "/no-bot",      priority: 0.8,  changeFrequency: "monthly" as const },
    { path: "/changelog",  priority: 0.5,  changeFrequency: "monthly" as const },
    { path: "/roadmap",    priority: 0.5,  changeFrequency: "monthly" as const },
    { path: "/security",  priority: 0.5,  changeFrequency: "monthly" as const },
    { path: "/partners",  priority: 0.6,  changeFrequency: "monthly" as const },
    { path: "/vendors",   priority: 0.4,  changeFrequency: "yearly" as const },
    { path: "/dpa",       priority: 0.4,  changeFrequency: "yearly" as const },
  ];

  const entries: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: lastWeek,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  try {
    const publicCalls = await prisma.call.findMany({
      where: { isPublic: true },
      select: { id: true, updatedAt: true },
      take: 500,
    });
    entries.push(...publicCalls.map((c) => ({
      url: `${SITE_URL}/share/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.3,
    })));
  } catch (e) {
    console.error("sitemap: public share query failed", (e as Error)?.message?.slice(0, 200));
  }

  return entries;
}
