import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import VsTeaser from "@/components/vs-teaser";
import Differentiators from "@/components/differentiators";
import TrustStrip from "@/components/trust-strip";

const VS_HREFS = ["/vs/otter-ai", "/vs/fireflies", "/vs/gong"];

const NINE_LOGOS = [
  "HubSpot",
  "Salesforce",
  "Slack",
  "Google Meet",
  "Zoom",
  "Chrome",
  "Microsoft Teams",
  "Google Calendar",
  "Outlook",
];

// PR #42 memorial: never invent customers, counts, or superlatives.
const BANNED_CLAIMS = [
  "trusted by",
  "10,000+",
  "10,000+ customers",
  "best in class",
  "#1",
  "industry leader",
  "Acme",
  "John Smith",
];

describe("VsTeaser (P2B)", () => {
  it("renders 3 cards with correct comparison hrefs", () => {
    render(<VsTeaser />);
    const all = screen.getAllByRole("link", { name: /read comparison/i });
    expect(all).toHaveLength(3);
    expect(all.map((a) => a.getAttribute("href")).sort()).toEqual(
      [...VS_HREFS].sort()
    );
  });

  it("exposes data-track-section=vs-teaser", () => {
    const { container } = render(<VsTeaser />);
    expect(
      container.querySelector('section[data-track-section="vs-teaser"]')
    ).not.toBeNull();
  });

  it("footnotes public pricing date + links /otter-alternative", () => {
    render(<VsTeaser />);
    expect(screen.getByText(/July 2026/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /otter-alternative/ });
    expect(link.getAttribute("href")).toBe("/otter-alternative");
  });

  it("one-line winner hint per card, no fake claims", () => {
    const { container } = render(<VsTeaser />);
    const text = container.textContent ?? "";
    expect(text).toContain("Otter.ai");
    expect(text).toContain("Fireflies.ai");
    expect(text).toContain("Gong");
    for (const banned of BANNED_CLAIMS) {
      expect(text.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });
});

describe("P2B integrations wall (differentiators + trust-strip)", () => {
  it("differentiators renders 9 logos with Live / Coming Soon pills", () => {
    render(<Differentiators />);
    for (const alt of NINE_LOGOS) {
      expect(screen.getByAltText(alt)).toBeInTheDocument();
    }
    // status pills present
    expect(screen.getAllByText("Live").length).toBeGreaterThanOrEqual(7);
    expect(screen.getAllByText("Coming Soon").length).toBeGreaterThanOrEqual(
      2
    );
  });

  it("differentiators honesty fix: Zoom is Coming Soon, not Live", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/differentiators.tsx"),
      "utf8"
    );
    expect(src).toContain('alt: "Zoom", status: "Coming Soon"');
    expect(src).not.toContain('alt: "Zoom", status: "Live"');
  });

  it("trust-strip mirrors the same 3 additions (9 logos)", () => {
    render(<TrustStrip />);
    for (const alt of NINE_LOGOS) {
      expect(screen.getByAltText(alt)).toBeInTheDocument();
    }
  });

  it("no fake claims in touched sources", () => {
    for (const file of [
      "src/components/vs-teaser.tsx",
      "src/components/differentiators.tsx",
      "src/components/trust-strip.tsx",
    ]) {
      const src = readFileSync(join(process.cwd(), file), "utf8").toLowerCase();
      for (const banned of BANNED_CLAIMS) {
        expect(src).not.toContain(banned.toLowerCase());
      }
    }
  });
});
