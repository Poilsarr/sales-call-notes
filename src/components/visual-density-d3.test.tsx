import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import PersonasTabs, { PERSONAS } from "@/components/personas-tabs";
import SocialProof from "@/components/social-proof";

/**
 * VISUAL-DENSITY D3 — tab pane is calm text + max one product still.
 * Copy is verbatim (pinned by personas-tabs.test + SSOT); this file pins
 * only the single still so the pins stay green.
 */

describe("D3 Personas visuals (2-col tab pane)", () => {
  it("renders the tab pane as a 2-col grid with text left + visual right", () => {
    const { container } = render(<PersonasTabs />);
    const card = container.querySelector('[aria-live="polite"]');
    expect(card).not.toBeNull();
    const grid = card?.querySelector(".grid.md\\:grid-cols-2, .grid");
    expect(grid).not.toBeNull();
    expect(grid?.className).toMatch(/md:grid-cols-2/);
  });

  it("shows the single product still on every tab, keeping all text markers", () => {
    const { container } = render(<PersonasTabs />);
    for (const p of PERSONAS) {
      fireEvent.click(
        screen.getByRole("button", { name: `Show ${p.label} workflow` })
      );
      // Text column keeps every pinned marker verbatim.
      expect(screen.getByText(p.headline)).toBeInTheDocument();
      expect(screen.getByText(p.body)).toBeInTheDocument();
      expect(screen.getByText(p.radar, { exact: false })).toBeInTheDocument();
      const link = container.querySelector(
        `[aria-label$="for ${p.label}"]`
      ) as HTMLAnchorElement | null;
      expect(link).not.toBeNull();
      expect(["/features", "/demo"]).toContain(link?.getAttribute("href"));

      // Visual column shows the single shared still (max one).
      const visual = screen.getByTestId("persona-visual-proof");
      expect(visual).toBeInTheDocument();
      expect(visual.getAttribute("class")).toMatch(/product-chrome/);
      const img = visual.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toMatch(/^\/product\//);
    }
  });

  it("keeps the peach icon chip as the single F26522 marker", () => {
    const { container } = render(<PersonasTabs />);
    for (const p of PERSONAS) {
      fireEvent.click(
        screen.getByRole("button", { name: `Show ${p.label} workflow` })
      );
      const visual = screen.getByTestId("persona-visual-proof");
      expect(visual.innerHTML).not.toMatch(/F26522/);
    }
    // The pinned chip itself is still there.
    expect(container.querySelector('[class*="F26522"]')).not.toBeNull();
  });

  it("retired per-rep coded bars: single still has honest alt, no invented reps", () => {
    render(<PersonasTabs />);
    fireEvent.click(
      screen.getByRole("button", { name: "Show Sales managers workflow" })
    );
    const visual = screen.getByTestId("persona-visual-proof");
    const img = visual.querySelector("img");
    expect(img?.getAttribute("alt")).toBeTruthy();
    expect(visual.textContent).not.toMatch(/Maya|Jon/);
  });
});

describe("D3 SocialProof visuals (stats + tiles + quote)", () => {
  it("stats are bigger/bolder with a per-stat color accent", () => {
    const { container } = render(<SocialProof />);
    const stats = container.querySelectorAll(
      '[data-testid="social-proof-stat"]'
    );
    expect(stats).toHaveLength(4);
    for (const stat of Array.from(stats)) {
      const value = stat.querySelector("div");
      expect(value?.className).toMatch(/text-3xl/);
      expect(value?.className).toMatch(/font-bold/);
      // Accent color applied inline (style attr) — all four differ.
      expect((value as HTMLElement)?.style?.color).not.toBe("");
    }
    const colors = Array.from(stats).map(
      (s) => (s.querySelector("div") as HTMLElement)?.style?.color
    );
    expect(new Set(colors).size).toBe(4);
    // Values themselves stay verbatim.
    for (const v of ["500+", "12", "60s", "99.2%"]) {
      expect(screen.getByText(v)).toBeInTheDocument();
    }
  });

  it("segment cards get larger distinct-pastel icon tiles, copy verbatim", () => {
    const { container } = render(<SocialProof />);
    const segments = container.querySelectorAll(
      '[data-testid="social-proof-segment"]'
    );
    expect(segments).toHaveLength(3);
    const tileClasses = Array.from(segments).map(
      (s) =>
        s.querySelector(".w-12.h-12, .w-12")?.className ?? ""
    );
    // Larger tiles on every card…
    for (const tile of tileClasses) {
      expect(tile).toMatch(/w-12/);
      expect(tile).toMatch(/rounded-2xl/);
    }
    // …with distinct pastel fills per card.
    expect(new Set(tileClasses).size).toBe(3);
    // Copy untouched.
    for (const t of ["Solo SDRs", "RevOps teams", "Sales managers"]) {
      expect(screen.getByText(t)).toBeInTheDocument();
    }
  });

  it("quote card gets an oversized mark + stat chips, quote + CTA verbatim", () => {
    const { container } = render(<SocialProof />);
    expect(screen.getByText("Alex R.")).toBeInTheDocument();
    expect(
      screen.getByText("Gong mention I completely missed", { exact: false })
    ).toBeInTheDocument();
    const chips = screen.getByTestId("social-proof-quote-chips");
    expect(within(chips).getByText("500+ calls")).toBeInTheDocument();
    expect(within(chips).getByText("60s avg")).toBeInTheDocument();
    expect(within(chips).getByText("12 beta teams")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /Join the beta/i });
    expect(cta.getAttribute("href")).toBe("/sign-up");
    expect(
      container.querySelector('a[href="/sign-up"]')
    ).not.toBeNull();
  });
});
