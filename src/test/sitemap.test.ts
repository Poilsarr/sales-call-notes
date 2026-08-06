import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: { call: { findMany: vi.fn() } },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

import sitemap from "@/app/sitemap";

const STATIC_ROUTE_COUNT = 24;
const SITE_URL = "https://usegauge.com";

const staticPathCount = (entries: { url: string }[]) =>
  entries.filter((e) => e.url.startsWith(`${SITE_URL}/share/`)).length;

describe("sitemap()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("appends public share URLs after the static routes", async () => {
    mocks.prisma.call.findMany.mockResolvedValue([{ id: "abc" }, { id: "def" }]);

    const entries = await sitemap();

    expect(entries).toHaveLength(STATIC_ROUTE_COUNT + 2);
    expect(entries.filter((e) => e.url.startsWith(`${SITE_URL}/share/`)).length).toBe(2);
    expect(entries.some((e) => e.url === `${SITE_URL}/share/abc`)).toBe(true);
    expect(entries.some((e) => e.url === `${SITE_URL}/share/def`)).toBe(true);
    expect(entries.some((e) => e.url === `${SITE_URL}/`)).toBe(true);
    expect(entries.some((e) => e.url === `${SITE_URL}/pricing`)).toBe(true);
  });

  it("share rows carry updatedAt as lastModified, weekly, priority 0.3", async () => {
    const updated = new Date("2026-01-02T03:04:05.000Z");
    mocks.prisma.call.findMany.mockResolvedValue([{ id: "abc", updatedAt: updated }]);

    const entries = await sitemap();

    const share = entries.find((e) => e.url === `${SITE_URL}/share/abc`);
    expect(share).toBeDefined();
    expect(share?.lastModified).toEqual(updated);
    expect(share?.changeFrequency).toBe("weekly");
    expect(share?.priority).toBe(0.3);
  });

  it("returns static routes only when findMany rejects", async () => {
    mocks.prisma.call.findMany.mockRejectedValue(new Error("db down"));

    const entries = await sitemap();

    expect(entries).toHaveLength(STATIC_ROUTE_COUNT);
    expect(staticPathCount(entries)).toBe(0);
  });

  it("returns static routes only when findMany returns an empty list", async () => {
    mocks.prisma.call.findMany.mockResolvedValue([]);

    const entries = await sitemap();

    expect(entries).toHaveLength(STATIC_ROUTE_COUNT);
    expect(staticPathCount(entries)).toBe(0);
  });
});