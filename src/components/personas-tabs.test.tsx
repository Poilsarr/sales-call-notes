import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import PersonasTabs, { PERSONAS } from "@/components/personas-tabs";
import SocialProof from "@/components/social-proof";
import { HOMEPAGE_COPY } from "@/lib/homepage-copy";

const EXPECTED_LABELS = [
  "Solo SDRs",
  "AE/Discovery",
  "RevOps",
  "Sales managers",
  "Founder",
];

describe("PersonasTabs (GAUGE-REDESIGN-PART2 P2A)", () => {
  it("renders exactly 5 tabs derived from SEGMENTS + CASES", () => {
    render(<PersonasTabs />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
    for (const label of EXPECTED_LABELS) {
      expect(
        screen.getByRole("button", { name: `Show ${label} workflow` })
      ).toBeInTheDocument();
    }
    expect(PERSONAS.map((p) => p.label)).toEqual(EXPECTED_LABELS);
  });

  it("switching tabs updates the card", () => {
    render(<PersonasTabs />);
    // Initial card shows the first persona.
    expect(screen.getByText(PERSONAS[0].headline)).toBeInTheDocument();
    expect(screen.getByText(PERSONAS[0].body)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Show RevOps workflow" })
    );
    expect(screen.getByText(PERSONAS[2].headline)).toBeInTheDocument();
    expect(screen.getByText(PERSONAS[2].body)).toBeInTheDocument();
    expect(screen.queryByText(PERSONAS[0].headline)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Show Founder workflow" })
    );
    expect(screen.getByText(PERSONAS[4].headline)).toBeInTheDocument();
    expect(screen.queryByText(PERSONAS[2].headline)).not.toBeInTheDocument();
  });

  it("exposes live-proof-style a11y attrs + personas tracking", () => {
    const { container } = render(<PersonasTabs />);
    const section = container.querySelector(
      'section[data-track-section="personas"]'
    );
    expect(section).not.toBeNull();
    expect(section?.getAttribute("aria-label")).toBe(
      "Personas — pick your seat"
    );

    const buttons = screen.getAllByRole("button");
    // First tab active initially.
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    expect(buttons[1].getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(buttons[3]);
    expect(buttons[3].getAttribute("aria-pressed")).toBe("true");
    expect(buttons[0].getAttribute("aria-pressed")).toBe("false");

    // Card is a polite live region with doppel shell + peach chip.
    const card = container.querySelector('[aria-live="polite"]');
    expect(card).not.toBeNull();
    expect(card?.className).toContain("doppel-inner");
    expect(card?.parentElement?.className).toContain("doppel-outer");
    expect(container.querySelector('[class*="F26522"]')).not.toBeNull();
  });

  it("keeps per-tab radar angle + /features or /demo link", () => {
    const { container } = render(<PersonasTabs />);
    for (const p of PERSONAS) {
      fireEvent.click(
        screen.getByRole("button", { name: `Show ${p.label} workflow` })
      );
      expect(screen.getByText(p.radar, { exact: false })).toBeInTheDocument();
      const link = container.querySelector(
        `[aria-label$="for ${p.label}"]`
      ) as HTMLAnchorElement | null;
      expect(link).not.toBeNull();
      expect(["/features", "/demo"]).toContain(link?.getAttribute("href"));
    }
  });

  it("stays pinned to proof SSOT (no invented customers)", () => {
    render(<PersonasTabs />);
    fireEvent.click(
      screen.getByRole("button", { name: "Show Founder workflow" })
    );
    // Founder honesty line reuses the SSOT beta-teams string.
    expect(
      screen.getByText(HOMEPAGE_COPY.proof.betaTeams, { exact: false })
    ).toBeInTheDocument();

    const src = readFileSync(
      join(process.cwd(), "src/components/personas-tabs.tsx"),
      "utf8"
    );
    expect(src).toContain("HOMEPAGE_COPY");
    expect(src).toContain('data-track-section="personas"');
  });
});

describe("SocialProof P2A evolution (stats + honesty card)", () => {
  it("keeps Alex R. quote + SSOT stats", () => {
    render(<SocialProof />);
    expect(screen.getByText("500+")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("60s")).toBeInTheDocument();
    expect(screen.getByText("99.2%")).toBeInTheDocument();
    expect(screen.getByText("Alex R.")).toBeInTheDocument();
    // Quote area keeps the honest Gong-miss line (SSOT proof.quote theme).
    expect(
      screen.getByText("Gong mention I completely missed", { exact: false })
    ).toBeInTheDocument();
  });

  it("adds the honesty stat card and keeps the /sign-up CTA", () => {
    const { container } = render(<SocialProof />);
    expect(
      screen.getByText("12 beta teams · building in open.")
    ).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /Join the beta/i });
    expect(cta.getAttribute("href")).toBe("/sign-up");
    expect(
      container.querySelector('a[href="/sign-up"]')
    ).not.toBeNull();
  });
});
