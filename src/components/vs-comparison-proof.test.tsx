import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("@/components/nav", () => ({
  default: () => <div data-testid="nav" />,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import {
  VsComparisonPage,
  type ComparisonData,
} from "@/components/vs-comparison";
import type { ProductVisualVariant } from "@/components/product-visual-card";

afterEach(() => {
  cleanup();
});

function makeData(competitorName: string, slug: string): ComparisonData {
  return {
    slug,
    competitorName,
    competitorTagline: `${competitorName} tagline`,
    competitorFounded: "2016",
    competitorFunding: "$10M raised",
    competitorUsers: "1M users",
    metaTitle: `${competitorName} alternative`,
    metaDescription: `${competitorName} comparison`,
    heroHeadline: `The ${competitorName} alternative`,
    heroSubhead: `Why teams switch from ${competitorName}.`,
    talkingPoints: ["Flat pricing, not per-seat", "No bot in your meeting"],
    tldr: [{ label: "Free tier", us: "300 min/mo", them: "Limited" }],
    competitorWins: ["Big brand"],
    ourWins: [{ title: "Flat pricing", detail: "One price." }],
    pricing: [{ tier: "Free", us: "$0", them: "$0" }],
    whoShouldPickCompetitor: ["You love them"],
    whoShouldPickUs: ["You want flat pricing"],
    faq: [
      {
        q: `Is Gauge cheaper than ${competitorName}?`,
        a: "Yes — flat pricing.",
      },
    ],
  };
}

// The 5 live /vs/* pages and their proof-card variants
// (transcript for otter/fathom, slack for fireflies/tldv, crm for gong).
const PAGES: {
  slug: string;
  competitor: string;
  variant: ProductVisualVariant;
}[] = [
  { slug: "otter-ai", competitor: "Otter.ai", variant: "transcript" },
  { slug: "fathom", competitor: "Fathom", variant: "transcript" },
  { slug: "fireflies", competitor: "Fireflies.ai", variant: "slack" },
  { slug: "tldv", competitor: "tl;dv", variant: "slack" },
  { slug: "gong", competitor: "Gong", variant: "crm" },
];

describe("VsComparisonPage proof card (R1)", () => {
  it("renders the proof card on all 5 page datas", () => {
    expect(PAGES).toHaveLength(5);
    for (const page of PAGES) {
      render(
        <VsComparisonPage
          data={makeData(page.competitor, page.slug)}
          visualVariant={page.variant}
        />
      );
      expect(screen.getByText("Product proof")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Upload a recording — get BANT, MEDDIC, and action items"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Product mock — ${page.variant} view`)
      ).toBeInTheDocument();
      // Competitor name still flows through the template.
      expect(
        screen.getByText(`The ${page.competitor} alternative`)
      ).toBeInTheDocument();
      cleanup();
    }
  });

  it("defaults to the transcript variant when no prop is passed", () => {
    render(<VsComparisonPage data={makeData("Otter.ai", "otter-ai")} />);
    expect(
      screen.getByText("Product mock — transcript view")
    ).toBeInTheDocument();
  });

  it("exposes sign-up, pricing, and live-demo CTA hrefs", () => {
    render(<VsComparisonPage data={makeData("Gong", "gong")} />);
    const signups = screen.getAllByRole("link", { name: /start free/i });
    expect(signups).toHaveLength(2);
    for (const link of signups) {
      expect(link.getAttribute("href")).toBe("/sign-up");
    }
    expect(
      screen.getByRole("link", { name: /see full pricing/i }).getAttribute("href")
    ).toBe("/pricing");
    expect(
      screen.getByRole("link", { name: /see live demo/i }).getAttribute("href")
    ).toBe("/demo");
  });

  it("renders no duplicate ids", () => {
    const { container } = render(
      <VsComparisonPage data={makeData("Fathom", "fathom")} />
    );
    const ids = Array.from(container.querySelectorAll("[id]")).map(
      (el) => el.id
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses the #F26522 CTA system, not the drifted #C94F17", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/vs-comparison.tsx"),
      "utf8"
    );
    expect(src).toContain("bg-[#F26522] hover:bg-[#e05a1a]");
    expect(src).not.toContain("#C94F17");
    expect(src).not.toContain("#b04011");

    const { container } = render(
      <VsComparisonPage data={makeData("Otter.ai", "otter-ai")} />
    );
    const ctas = container.querySelectorAll('a[href="/sign-up"]');
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of Array.from(ctas)) {
      expect(cta.className).toContain("bg-[#F26522]");
    }
  });

  it("privacy wedge keeps copy and adds mono pills with no new claims", () => {
    render(<VsComparisonPage data={makeData("Gong", "gong")} />);
    expect(screen.getByText("Privacy-first, by default")).toBeInTheDocument();
    for (const pill of [
      "No auto-join",
      "No training on audio",
      "GDPR-ready",
      "Delete anytime",
    ]) {
      expect(screen.getByText(pill)).toBeInTheDocument();
    }
  });
});
