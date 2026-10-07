import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import ProductVisualsSection from "@/components/product-visuals-section";
import { ProductVisualCard } from "@/components/product-visual-card";
import { PRODUCT_STILLS } from "@/lib/demo-call-fiction";

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

  it("renders exactly 3 soft doppel cards with product stills", () => {
    const { container } = render(<ProductVisualsSection />);
    const section = container.querySelector(
      '[data-track-section="product-visuals"]',
    ) as HTMLElement;
    const scope = within(section);
    expect(scope.getByText("01 · Transcript proof")).toBeDefined();
    expect(scope.getByText("02 · Slack ping")).toBeDefined();
    expect(scope.getByText("03 · CRM sync")).toBeDefined();
    expect(section.querySelectorAll(".doppel-outer").length).toBe(3);
    expect(section.querySelectorAll(".product-chrome").length).toBe(3);

    const imgs = section.querySelectorAll("img");
    expect(imgs.length).toBe(3);
    const srcs = Array.from(imgs).map((img) => img.getAttribute("src") ?? "");
    expect(srcs.some((s) => s.includes(PRODUCT_STILLS.transcript))).toBe(true);
    expect(srcs.some((s) => s.includes(PRODUCT_STILLS.slack))).toBe(true);
    expect(srcs.some((s) => s.includes(PRODUCT_STILLS.crm))).toBe(true);
  });

  it("never uses washi tape or hard film shadow", () => {
    const { container } = render(<ProductVisualsSection />);
    const section = container.querySelector(
      '[data-track-section="product-visuals"]',
    ) as HTMLElement;
    expect(section.querySelectorAll(".bg-film-amber").length).toBe(0);
    expect(section.querySelectorAll("[class*='bg-film-amber']").length).toBe(0);
    expect(
      section.querySelectorAll("[class*='shadow-[8px_8px_0_#131316]']").length,
    ).toBe(0);
    expect(section.innerHTML).not.toContain("shadow-[8px_8px_0_#131316]");
    expect(container.querySelector('[id="demo"]')).toBeNull();
  });

  it("covers all three live-proof datasets (Acme/Gong, Vandelay/Otter, Stark/Fireflies)", () => {
    const { container } = render(<ProductVisualsSection />);
    const section = container.querySelector(
      '[data-track-section="product-visuals"]',
    ) as HTMLElement;
    const scope = within(section);
    for (const pattern of [
      /Sarah Chen/,
      /00:14:22/,
      /Gong/,
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

  it("ProductVisualCard renders standalone with defaults (transcript)", () => {
    const { container } = render(
      <ProductVisualCard
        variant="transcript"
        eyebrow="01 · Transcript proof"
        title="Standalone title"
        body="Standalone body copy with Sarah Chen and Gong."
        footer="Acme Corp · Discovery · conf 0.96"
      />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toContain("/product/transcript-proof.svg");
    expect(container.textContent).toContain("Sarah Chen");
    expect(container.textContent).toContain("Gong");
    expect(container.textContent).toContain("Standalone title");
    expect(container.querySelector(".doppel-outer")).not.toBeNull();
    expect(container.querySelector(".bg-film-amber")).toBeNull();
  });
});
