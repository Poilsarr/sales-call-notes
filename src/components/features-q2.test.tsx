import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: null, isLoaded: true, isSignedIn: false }),
  SignInButton: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

vi.mock("@/components/nav", () => ({
  default: () => <div data-testid="nav" />,
}));
vi.mock("@/components/sticky-marketing-cta", () => ({
  default: () => <div />,
}));

import FeaturesPageClient from "@/components/features-page-client";
import { featureContent } from "@/lib/feature-content";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
    writable: true,
    configurable: true,
  });
});

describe("Q2 — feature-content honesty", () => {
  it("keeps all 12 entries with summary/bullets/specs/meta shape", () => {
    expect(Object.keys(featureContent)).toHaveLength(12);
    for (let i = 1; i <= 12; i++) {
      const c = featureContent[i];
      expect(typeof c.summary).toBe("string");
      expect(c.bullets.length).toBeGreaterThan(0);
      expect(c.specs.length).toBeGreaterThan(0);
      expect(c.meta.length).toBeGreaterThan(0);
    }
  });

  it("drops unevidenced metrics (98.2%, 10k+, 92%, DER 6.8%, 99.9%)", () => {
    const joined = Object.values(featureContent)
      .map((c) =>
        [c.summary, ...c.bullets, ...c.specs.map((s) => `${s.label} ${s.value}`), ...c.meta.map((m) => `${m.label} ${m.value}`)].join("\n")
      )
      .join("\n");
    for (const banned of ["98.2%", "10k+", "92%", "DER 6.8%", "99.9%", "99 supported", "99 via"]) {
      expect(joined).not.toContain(banned);
    }
  });

  it("tells a single copy/push story (no two-way sync) and cloud-default privacy (no local-default)", () => {
    const joined = Object.values(featureContent)
      .map((c) => [c.summary, ...c.bullets].join("\n"))
      .join("\n");
    expect(joined).not.toMatch(/two-way sync/i);
    expect(joined).not.toMatch(/stay local, cloud is opt-in/i);
    expect(joined).toMatch(/cloud.*default/i);
    expect(joined).toMatch(/never used to train/i);
  });

  it("uses one language number and keeps the api-docs pin + OpenAPI ban", () => {
    const joined = Object.values(featureContent)
      .map((c) => [c.summary, ...c.specs.map((s) => s.value), ...c.meta.map((m) => m.value)].join("\n"))
      .join("\n");
    expect(joined).not.toContain("99");
    expect(joined).toMatch(/12 first-class/);
    expect(joined).toContain("Documented at /api-docs/v1");
    expect(joined).not.toContain("OpenAPI 3.1 spec published");
  });
});

describe("Q2 — features page proof wiring (structure)", () => {
  it("page source: hero CTA row, ProductVisualsSection import + mount between bundle and comparison, vs links", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(
      join(process.cwd(), "src/components/features-page-client.tsx"),
      "utf8"
    );
    // Hero CTA row keeps ParticleCanvas + HeroMockup (bundle) intact.
    expect(src).toContain('href="/sign-up"');
    expect(src).toContain('href="/pricing"');
    expect(src).toContain("Start free");
    expect(src).toContain("See pricing");
    expect(src).toContain("ParticleCanvas");
    expect(src).toContain('<FeaturesBundle variant="hero"');
    // Band: import (reuse, no copy) + mount between workflow bundle and comparison.
    expect(src).toContain('import { ProductVisualsSection } from "@/components/product-visuals-section"');
    const bundleIdx = src.indexOf('<FeaturesBundle variant="features"');
    const bandIdx = src.indexOf("<ProductVisualsSection />");
    const comparisonIdx = src.indexOf("<ComparisonSection />");
    expect(bundleIdx).toBeGreaterThan(-1);
    expect(bandIdx).toBeGreaterThan(bundleIdx);
    expect(comparisonIdx).toBeGreaterThan(bandIdx);
    // Comparison links kill forked-claim risk.
    for (const href of ["/vs/otter-ai", "/vs/fireflies", "/vs/gong", "/otter-alternative"]) {
      expect(src).toContain(`href="${href}"`);
    }
    expect(src).toContain("Read comparison →");
  });

  it("animations source: 12 per-card links, Learn-more toggle untouched", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(
      join(process.cwd(), "src/components/features-animations.tsx"),
      "utf8"
    );
    expect(src).toContain("cardLinks");
    for (const href of ["/pricing", "/api-docs/v1", "/privacy", "/vs/otter-ai", "/vs/fireflies", "/vs/gong"]) {
      expect(src).toContain(`"${href}"`);
    }
    // Toggle behavior preserved.
    expect(src).toContain("setIsExpanded");
    expect(src).toContain("Learn more");
    expect(src).toContain("aria-expanded={isExpanded}");
  });
});

describe("Q2 — features page proof wiring (render)", () => {
  it("hero CTA row links Start free → /sign-up and See pricing → /pricing", () => {
    const { container } = render(<FeaturesPageClient />);
    const startFree = screen.getByRole("link", { name: /start free/i });
    const seePricing = screen.getByRole("link", { name: /see pricing/i });
    expect(startFree.getAttribute("href")).toBe("/sign-up");
    expect(seePricing.getAttribute("href")).toBe("/pricing");
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("product-visuals band renders before the comparison table, comparison links resolve", () => {
    const { container } = render(<FeaturesPageClient />);
    expect(
      screen.getByRole("heading", { name: /every signal ships with proof/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /gauge vs otter\.ai vs fireflies\.ai/i })
    ).toBeInTheDocument();
    const html = container.innerHTML;
    const bandIdx = html.indexOf('data-track-section="product-visuals"');
    const comparisonIdx = html.indexOf("Gauge vs Otter.ai vs Fireflies.ai");
    const faqIdx = html.indexOf("Features questions, answered");
    expect(bandIdx).toBeGreaterThan(-1);
    expect(comparisonIdx).toBeGreaterThan(bandIdx);
    expect(faqIdx).toBeGreaterThan(comparisonIdx);
    for (const name of [/gauge vs otter\.ai — read comparison/i, /gauge vs fireflies\.ai — read comparison/i, /gauge vs gong — read comparison/i]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
    const roundup = screen.getByRole("link", { name: /otter-alternative/i });
    expect(roundup.getAttribute("href")).toBe("/otter-alternative");
  });
});
