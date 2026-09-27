import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import TrustStrip from "@/components/trust-strip";
import { ProofStrip } from "@/components/proof-strip";
import { HOMEPAGE_COPY } from "@/lib/homepage-copy";

const LOGO_ALTS = [
  "HubSpot",
  "Salesforce",
  "Slack",
  "Google Meet",
  "Zoom",
  "Chrome",
];

describe("TrustStrip (GAUGE-REDESIGN-PART1 E1)", () => {
  it("renders proof copy from HOMEPAGE_COPY", () => {
    render(<TrustStrip />);
    expect(
      screen.getByText(HOMEPAGE_COPY.proof.betaTeams)
    ).toBeInTheDocument();
    expect(screen.getAllByText(HOMEPAGE_COPY.proof.calls).length).toBeGreaterThan(
      0
    );
    expect(
      screen.getByText(HOMEPAGE_COPY.proof.quote, { exact: false })
    ).toBeInTheDocument();
    expect(
      screen.getByText(HOMEPAGE_COPY.proof.attribution, { exact: false })
    ).toBeInTheDocument();
  });

  it("renders mono stats row", () => {
    render(<TrustStrip />);
    expect(screen.getByText("60s avg processing")).toBeInTheDocument();
    expect(screen.getByText("99.2% uptime")).toBeInTheDocument();
  });

  it("renders 6 integration logos with alt text", () => {
    render(<TrustStrip />);
    for (const alt of LOGO_ALTS) {
      expect(screen.getByAltText(alt)).toBeInTheDocument();
    }
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(LOGO_ALTS.length);
  });

  it("exposes aria-label Early traction + data-track-section trust", () => {
    const { container } = render(<TrustStrip />);
    const section = container.querySelector(
      'section[data-track-section="trust"]'
    );
    expect(section).not.toBeNull();
    expect(section?.getAttribute("aria-label")).toBe("Early traction");
    expect(section?.className).toContain("bg-white");
  });

  it("imports copy from HOMEPAGE_COPY — no hardcoded proof literal in source", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/trust-strip.tsx"),
      "utf8"
    );
    expect(src).toContain("HOMEPAGE_COPY");
    expect(src).not.toContain(HOMEPAGE_COPY.proof.betaTeams);
    expect(src).not.toContain(HOMEPAGE_COPY.proof.quote);
  });

  it("proof-strip shim still exports ProofStrip", () => {
    expect(ProofStrip).toBe(TrustStrip);
  });
});
