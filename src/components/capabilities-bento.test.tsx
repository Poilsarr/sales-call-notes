import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import CapabilitiesBento from "@/components/capabilities-bento";

const TITLES = [
  "Upload or record",
  "Track competitors",
  "CRM-ready notes",
  "Transparent privacy",
] as const;

const BODIES = [
  "Drop in an MP3, record in your browser, or capture Google Meet — no bot ever joins the call.",
  "Every call is scanned for competitor names. You get a Slack ping the second Gong, Otter, or Chorus shows up in a deal.",
  "Summary, owners and due dates, and a follow-up draft — one click into HubSpot or Salesforce.",
  "Your calls are processed by disclosed cloud providers, never used to train our models, and covered by export and deletion controls.",
] as const;

function section() {
  const { container } = render(<CapabilitiesBento />);
  const el = container.querySelector(
    'section[data-track-section="capabilities"]',
  ) as HTMLElement;
  expect(el).not.toBeNull();
  return { container, el, scope: within(el) };
}

describe("CapabilitiesBento", () => {
  it("keeps the track-section shell, eyebrow, H2, and sub", () => {
    const { el, scope } = section();
    expect(el.getAttribute("aria-labelledby")).toBe("capabilities-heading");
    expect(scope.getByText("Capabilities")).toBeDefined();
    expect(
      scope.getByRole("heading", {
        name: /built for sdrs who lose deals to competitors/i,
      }),
    ).toBeDefined();
    expect(scope.getByText("Four things. No filler.")).toBeDefined();
  });

  it("renders 4 cards with the verbatim titles and bodies", () => {
    const { el, scope } = section();
    for (const title of TITLES) {
      expect(scope.getByText(title)).toBeDefined();
    }
    for (const body of BODIES) {
      // Upload/track/privacy bodies repeat substrings in their visuals.
      expect(
        scope.getAllByText(body).length,
        `expected verbatim body: ${body.slice(0, 40)}…`,
      ).toBeGreaterThanOrEqual(1);
    }
    // One soft doppel card shell per capability, in a 2-col bento grid.
    const shells = el.querySelectorAll(".doppel-outer");
    expect(shells.length).toBe(4);
    expect(el.innerHTML).not.toContain("shadow-[8px_8px_0_#131316]");
    for (const shell of shells) {
      expect(shell.className).not.toMatch(/border-2/);
      expect(shell.className).not.toMatch(/shadow-\[8px_8px_0_#131316\]/);
    }
    expect(el.querySelector(".grid.md\\:grid-cols-2")).not.toBeNull();
  });

  it("renders the upload visual as a product still (meet-extension)", () => {
    const { container } = section();
    const visual = screen.getByTestId("capability-upload-visual");
    expect(visual).toBeDefined();
    expect(visual.querySelector(".product-chrome")).not.toBeNull();
    const img = visual.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toContain("/product/meet-extension.svg");
    expect(img?.getAttribute("alt")).toBeTruthy();
    expect(img?.getAttribute("width")).toBeTruthy();
    expect(img?.getAttribute("height")).toBeTruthy();
    expect(img?.getAttribute("loading")).toBe("lazy");
    expect(container.querySelector('[id="demo"]')).toBeNull();
  });

  it("renders the track visual as a product still (radar-board)", () => {
    const { container } = section();
    const visual = screen.getByTestId("capability-track-visual");
    expect(visual).toBeDefined();
    expect(visual.querySelector(".product-chrome")).not.toBeNull();
    const img = visual.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toContain("/product/radar-board.svg");
    expect(img?.getAttribute("alt")).toBeTruthy();
    expect(img?.getAttribute("loading")).toBe("lazy");
    expect(container.querySelector('[id="demo"]')).toBeNull();
  });

  it("renders the CRM visual as a product still (summary-owners)", () => {
    section();
    const visual = screen.getByTestId("capability-crm-visual");
    expect(visual).toBeDefined();
    expect(visual.querySelector(".product-chrome")).not.toBeNull();
    const img = visual.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toContain("/product/summary-owners.svg");
    expect(img?.getAttribute("alt")).toBeTruthy();
    expect(img?.getAttribute("loading")).toBe("lazy");
  });

  it("renders the privacy visual as a product still (coach-talk)", () => {
    section();
    const visual = screen.getByTestId("capability-privacy-visual");
    expect(visual).toBeDefined();
    expect(visual.querySelector(".product-chrome")).not.toBeNull();
    const img = visual.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toContain("/product/coach-talk.svg");
    expect(img?.getAttribute("alt")).toBeTruthy();
    expect(img?.getAttribute("loading")).toBe("lazy");
  });

  it("killed the old theoretical look: no peach icon chips, no id=demo", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/capabilities-bento.tsx"),
      "utf8",
    );
    expect(src).not.toContain("w-10 h-10");
    expect(src).not.toContain("bg-[#F26522]/10");
    expect(src).not.toContain('id="demo"');
    expect(src).not.toContain("shadow-[8px_8px_0_#131316]");
    expect(src).toContain("doppel-outer");
  });
});

