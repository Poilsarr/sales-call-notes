import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import IntegrationsBand from "@/components/integrations-band";

// Canonical Live display names — verbatim in differentiators BRANDS alts
// and integrations-page-client.tsx provider names.
const FOUR_LIVE = ["HubSpot", "Salesforce", "Slack", "Microsoft Teams"];

function bandSrc(): string {
  return readFileSync(
    join(process.cwd(), "src/components/integrations-band.tsx"),
    "utf8"
  );
}

describe("IntegrationsBand (light band)", () => {
  it("exposes data-track-section=integrations-band", () => {
    const { container } = render(<IntegrationsBand />);
    expect(
      container.querySelector('section[data-track-section="integrations-band"]')
    ).not.toBeNull();
  });

  it("renders the 4 Live provider names verbatim (logo alt + label)", () => {
    render(<IntegrationsBand />);
    for (const name of FOUR_LIVE) {
      expect(screen.getByAltText(name)).toBeInTheDocument();
      expect(
        screen.getByText(name, { selector: "span" })
      ).toBeInTheDocument();
    }
  });

  it("links to /integrations", () => {
    render(<IntegrationsBand />);
    const link = screen.getByRole("link", {
      name: /view all integrations/i,
    });
    expect(link.getAttribute("href")).toBe("/integrations");
  });

  it("light band only: no dark bg, no grayscale, no dark-band tokens", () => {
    const src = bandSrc();
    expect(src).not.toContain("bg-[#0a0a0b]");
    expect(src).not.toContain("grayscale");
    expect(src).not.toContain("font-film");
    expect(src).not.toContain("doppel-outer-dark");
    expect(src).not.toContain("doppel-inner-dark");
    expect(src).not.toContain("linear-");
  });

  it("uses accent #F26522 and the doppel-outer logo grid", () => {
    const src = bandSrc();
    expect(src).toContain("#F26522");
    expect(src).toContain("doppel-outer");
    expect(src).toContain("doppel-inner");
  });
});
