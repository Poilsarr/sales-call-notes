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
    // One doppel card shell per capability, in a 2-col bento grid.
    expect(
      el.querySelectorAll(".doppel-outer.border-2.border-film-ink").length,
    ).toBe(4);
    expect(el.querySelector(".grid.md\\:grid-cols-2")).not.toBeNull();
  });

  it("renders the upload dropzone visual (MP3 / Record / Meet / no-bot)", () => {
    const { scope } = section();
    const visual = screen.getByTestId("capability-upload-visual");
    expect(visual).toBeDefined();
    const v = within(visual as HTMLElement);
    expect(v.getByText("MP3")).toBeDefined();
    expect(v.getByText("Record")).toBeDefined();
    expect(v.getByText("Google Meet")).toBeDefined();
    expect(
      v.getByText(/no bot ever joins the call/i),
    ).toBeDefined();
    expect(visual.querySelector(".border-dashed")).not.toBeNull();
  });

  it("renders the slack-mini visual (rival signal + confidence bar)", () => {
    const { container } = section();
    const visual = screen.getByTestId("capability-track-visual");
    expect(visual).toBeDefined();
    const v = within(visual as HTMLElement);
    expect(v.getByText("Rival signal")).toBeDefined();
    expect(v.getByText("Rival: Gong")).toBeDefined();
    expect(v.getByText("#deal-room-acme")).toBeDefined();
    expect(v.getAllByText(/Slack ping/).length).toBeGreaterThanOrEqual(1);
    const bar = v.getByRole("progressbar", { name: /Gong confidence/ });
    expect(bar.getAttribute("aria-valuenow")).toBe("96");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(container.querySelector('[id="demo"]')).toBeNull();
  });

  it("renders the CRM visual (field rows + Health 8.2)", () => {
    section();
    const visual = screen.getByTestId("capability-crm-visual");
    expect(visual).toBeDefined();
    const v = within(visual as HTMLElement);
    expect(v.getByText("CRM sync")).toBeDefined();
    expect(v.getByText("HubSpot → Salesforce")).toBeDefined();
    for (const label of ["Deal", "Owner", "Close date", "Next step"]) {
      expect(v.getByText(label)).toBeDefined();
    }
    expect(v.getByText(/Health 8\.2/)).toBeDefined();
  });

  it("renders the privacy visual (shield + mono pills from the desc)", () => {
    section();
    const visual = screen.getByTestId("capability-privacy-visual");
    expect(visual).toBeDefined();
    const v = within(visual as HTMLElement);
    expect(v.getByText("Never trains")).toBeDefined();
    expect(v.getByText("Export + deletion")).toBeDefined();
    expect(v.getByText("Disclosed providers")).toBeDefined();
    expect(
      v.getByText(/never used to train our models/i),
    ).toBeDefined();
  });

  it("killed the old theoretical look: no peach icon chips, no id=demo", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/capabilities-bento.tsx"),
      "utf8",
    );
    expect(src).not.toContain("w-10 h-10");
    expect(src).not.toContain("bg-[#F26522]/10");
    expect(src).not.toContain('id="demo"');
  });
});
