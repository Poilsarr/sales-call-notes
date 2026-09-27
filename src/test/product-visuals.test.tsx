import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import ProductVisualsSection from "@/components/product-visuals-section";
import { ProductVisualCard } from "@/components/product-visual-card";

describe("ProductVisualsSection", () => {
  it("renders the section with tracking attr, eyebrow, H2, and subcopy", () => {
    const { container } = render(<ProductVisualsSection />);
    const section = container.querySelector(
      '[data-track-section="product-visuals"]',
    );
    expect(section).not.toBeNull();
    expect(
      within(section as HTMLElement).getByText("Product in action"),
    ).toBeDefined();
    expect(
      within(section as HTMLElement).getByRole("heading", {
        name: /every signal ships with proof/i,
      }),
    ).toBeDefined();
  });

  it("renders exactly 3 cards: transcript, slack, crm", () => {
    const { container } = render(<ProductVisualsSection />);
    const section = container.querySelector(
      '[data-track-section="product-visuals"]',
    ) as HTMLElement;
    const scope = within(section);
    expect(scope.getByText("01 · Transcript proof")).toBeDefined();
    expect(scope.getByText("02 · Slack ping")).toBeDefined();
    expect(scope.getByText("03 · CRM sync")).toBeDefined();
    // Card shells: one doppel-outer per card.
    expect(
      section.querySelectorAll(
        ".doppel-outer.border-2.border-film-ink",
      ).length,
    ).toBe(3);
  });

  it("covers all three live-proof datasets (Acme/Gong, Vandelay/Otter, Stark/Fireflies)", () => {
    const { container } = render(<ProductVisualsSection />);
    const section = container.querySelector(
      '[data-track-section="product-visuals"]',
    ) as HTMLElement;
    const scope = within(section);
    // Mock + bottom copy repeat the same literals — assert presence (≥1).
    for (const pattern of [
      /Sarah Chen/,
      /00:14:22/,
      /Rival: Gong/,
      /#deal-room-acme/,
      /Priya Shah/,
      /Otter\.ai/,
      /#deal-room-vandelay/,
      /Marcus Lee/,
      /Fireflies\.ai/,
      /#deal-room-stark/,
      /conf 0\.96/,
      /conf 0\.91/,
      /conf 0\.99/,
    ]) {
      expect(
        scope.getAllByText(pattern).length,
        `expected ${pattern} in product-visuals`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("exposes the confidence progressbar with full a11y attrs", () => {
    render(<ProductVisualsSection />);
    const bar = screen.getByRole("progressbar", {
      name: /Otter\.ai confidence/,
    });
    expect(bar.getAttribute("aria-valuenow")).toBe("91");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("shows speaker pills (Customer/Gauge/Slack) and the transcript quote block", () => {
    const { container } = render(<ProductVisualsSection />);
    const section = container.querySelector(
      '[data-track-section="product-visuals"]',
    ) as HTMLElement;
    const scope = within(section);
    expect(scope.getByText("Customer")).toBeDefined();
    expect(scope.getByText("Gauge")).toBeDefined();
    expect(scope.getByText("Slack")).toBeDefined();
    expect(scope.getByText(/Live summary/)).toBeDefined();
    expect(scope.getByText(/Action items/)).toBeDefined();
    const quotes = section.querySelectorAll("blockquote.border-l-2");
    expect(quotes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows the CRM mock (HubSpot → Salesforce, owners/dates) and Health 8.2 footers", () => {
    const { container } = render(<ProductVisualsSection />);
    const section = container.querySelector(
      '[data-track-section="product-visuals"]',
    ) as HTMLElement;
    const scope = within(section);
    // "CRM sync" appears in the mock header + the "03 · CRM sync" eyebrow;
    // "HubSpot → Salesforce" appears in the mock header + the card title.
    expect(scope.getAllByText(/CRM sync/).length).toBeGreaterThanOrEqual(2);
    expect(scope.getAllByText(/HubSpot → Salesforce/).length).toBeGreaterThanOrEqual(2);
    expect(scope.getAllByText("Owner").length).toBeGreaterThanOrEqual(1);
    expect(scope.getByText("Close date")).toBeDefined();
    expect(scope.getAllByText(/Health 8\.2/).length).toBeGreaterThanOrEqual(3);
  });

  it("overlays tape on every card and never duplicates id=\"demo\"", () => {
    const { container } = render(<ProductVisualsSection />);
    const section = container.querySelector(
      '[data-track-section="product-visuals"]',
    ) as HTMLElement;
    // Tape: w-24 h-6 bg-film-amber/60 rotate-[-2deg], one per card.
    expect(section.querySelectorAll(".bg-film-amber\\/60").length).toBe(3);
    expect(container.querySelector('[id="demo"]')).toBeNull();
  });

  it("ProductVisualCard renders standalone with defaults (transcript)", () => {
    const { container } = render(
      <ProductVisualCard
        variant="transcript"
        eyebrow="01 · Transcript proof"
        title="Standalone title"
        body="Standalone body copy."
        footer="Acme Corp · Discovery · conf 0.96"
      />,
    );
    expect(container.querySelector("blockquote.border-l-2")).not.toBeNull();
    expect(container.textContent).toContain("Sarah Chen");
    expect(container.textContent).toContain("Standalone title");
  });
});
