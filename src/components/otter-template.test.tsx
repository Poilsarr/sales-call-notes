import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import PricingTeaser, {
  PricingTeaser as NamedPricingTeaser,
} from "@/components/pricing-teaser";
import ObjectionTrio, {
  ObjectionTrio as NamedObjectionTrio,
} from "@/components/objection-trio";
import SeoLinks, { SeoLinks as NamedSeoLinks } from "@/components/seo-links";
import { PLANS } from "@/lib/plans";

const SOURCES = [
  "src/components/pricing-teaser.tsx",
  "src/components/objection-trio.tsx",
  "src/components/seo-links.tsx",
];

function srcOf(file: string): string {
  return readFileSync(join(process.cwd(), file), "utf8");
}

describe("otter-template: exports", () => {
  it("all three offer default + named exports resolving to the same component", () => {
    expect(NamedPricingTeaser).toBe(PricingTeaser);
    expect(NamedObjectionTrio).toBe(ObjectionTrio);
    expect(NamedSeoLinks).toBe(SeoLinks);
  });
});

describe("otter-template: track sections", () => {
  it("PricingTeaser exposes data-track-section=pricing-teaser", () => {
    const { container } = render(<PricingTeaser />);
    expect(
      container.querySelector('section[data-track-section="pricing-teaser"]')
    ).not.toBeNull();
  });

  it("ObjectionTrio exposes data-track-section=objections", () => {
    const { container } = render(<ObjectionTrio />);
    expect(
      container.querySelector('section[data-track-section="objections"]')
    ).not.toBeNull();
  });

  it("SeoLinks exposes data-track-section=related", () => {
    const { container } = render(<SeoLinks />);
    expect(
      container.querySelector('section[data-track-section="related"]')
    ).not.toBeNull();
  });
});

describe("otter-template: headings", () => {
  it("PricingTeaser renders a pricing heading", () => {
    render(<PricingTeaser />);
    expect(
      screen.getByRole("heading", { name: /simple pricing/i })
    ).toBeInTheDocument();
  });

  it("ObjectionTrio renders the three-question heading + three card headings", () => {
    render(<ObjectionTrio />);
    expect(
      screen.getByRole("heading", { name: /three questions/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /no-bot capture/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /data used to train models/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /crm push/i })
    ).toBeInTheDocument();
  });

  it("SeoLinks renders its directory heading", () => {
    render(<SeoLinks />);
    expect(
      screen.getByRole("heading", { name: /keep exploring/i })
    ).toBeInTheDocument();
  });
});

describe("otter-template: PricingTeaser reads plans.ts truth", () => {
  it("plans.ts holds Free 300 / Pro $9 1200 5 seats / Business $29 6000", () => {
    expect(PLANS.free.minuteLimit).toBe(300);
    expect(PLANS.free.priceLabel).toBe("Free");
    expect(PLANS.pro.priceLabel).toBe("$9");
    expect(PLANS.pro.minuteLimit).toBe(1200);
    expect(PLANS.pro.teamMemberLimit).toBe(5);
    expect(PLANS.business.priceLabel).toBe("$29");
    expect(PLANS.business.minuteLimit).toBe(6000);
  });

  it("renders the plan numbers from plans.ts", () => {
    const { container } = render(<PricingTeaser />);
    const text = container.textContent ?? "";
    expect(text).toContain("300");
    expect(text).toContain("$9");
    expect(text).toContain("1,200");
    expect(text).toContain("$29");
    expect(text).toContain("6,000");
  });

  it("CTAs: /sign-up x2 + enterprise contact + /pricing link", () => {
    render(<PricingTeaser />);
    const signups = screen.getAllByRole("link", { name: /start free/i });
    expect(signups).toHaveLength(2);
    for (const a of signups) {
      expect(a.getAttribute("href")).toBe("/sign-up");
    }
    const sales = screen.getByRole("link", { name: /contact sales/i });
    expect(sales.getAttribute("href")).toMatch(/^mailto:sales@usegauge\.com/);
    const pricing = screen.getByRole("link", { name: /compare all plans/i });
    expect(pricing.getAttribute("href")).toBe("/pricing");
  });
});

describe("otter-template: ObjectionTrio reuses differentiator strings verbatim", () => {
  it("card bodies match differentiators ROWS gauge strings exactly", () => {
    const diffSrc = srcOf("src/components/differentiators.tsx");
    for (const verbatim of [
      "Upload, record, or Meet — no bot joins",
      "One click on Pro ($9)",
    ]) {
      expect(diffSrc).toContain(verbatim);
    }
    const { container } = render(<ObjectionTrio />);
    const text = container.textContent ?? "";
    expect(text).toContain("Upload, record, or Meet — no bot joins");
    expect(text).toContain("Never");
    expect(text).toContain("One click on Pro ($9)");
  });

  it("renders exactly three cards, no links, no new CTAs", () => {
    const { container } = render(<ObjectionTrio />);
    const section = container.querySelector(
      'section[data-track-section="objections"]'
    )!;
    const headings = within(section as HTMLElement).getAllByRole("heading");
    // 1 section heading + 3 card headings
    expect(headings).toHaveLength(4);
    expect(section.querySelectorAll("a").length).toBe(0);
  });
});

describe("otter-template: SeoLinks hrefs resolve to existing routes", () => {
  const EXPECTED = [
    "/blog",
    "/vs/otter-ai",
    "/vs/fireflies",
    "/vs/gong",
    "/vs/fathom",
    "/vs/tldv",
    "/otter-alternative",
    "/api-docs",
    "/extension",
    "/demo",
  ];

  it("renders 8-10 links, all to existing page.tsx routes", () => {
    render(<SeoLinks />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(8);
    expect(links.length).toBeLessThanOrEqual(10);
    const hrefs = links.map((a) => a.getAttribute("href")).sort();
    expect(hrefs).toEqual([...EXPECTED].sort());
    for (const href of hrefs) {
      const page = join(process.cwd(), "src", "app", href!, "page.tsx");
      expect(existsSync(page), `${href} has no page.tsx`).toBe(true);
    }
  });
});

describe("otter-template: hygiene", () => {
  it('no id="demo" in any new source', () => {
    for (const file of SOURCES) {
      expect(srcOf(file)).not.toContain('id="demo"');
    }
    for (const el of [
      render(<PricingTeaser />).container,
      render(<ObjectionTrio />).container,
      render(<SeoLinks />).container,
    ]) {
      expect(el.querySelector("#demo")).toBeNull();
    }
  });

  it("no duplicate ids across the three sections", () => {
    const { container: a } = render(<PricingTeaser />);
    const { container: b } = render(<ObjectionTrio />);
    const { container: c } = render(<SeoLinks />);
    const ids: string[] = [];
    for (const root of [a, b, c]) {
      root.querySelectorAll("[id]").forEach((el) => ids.push(el.id));
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("server components: no use client directive", () => {
    for (const file of SOURCES) {
      expect(srcOf(file)).not.toMatch(/["']use client["']/);
    }
  });
});
