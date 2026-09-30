import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import HowItWorks from "@/components/how-it-works";

const STEPS = [
  {
    n: "01",
    title: "Bring the call",
    body: "Drop an MP3, hit record, or capture Google Meet. No bot ever joins.",
    detail: "MP3 · Record · Google Meet",
  },
  {
    n: "02",
    title: "Get notes + next steps in about a minute",
    body: "Transcript with speakers, summary, owners and dates, BANT/MEDDIC. Fast transcription + sales-tuned AI.",
    detail: "Transcript · Summary · Owners + dates",
  },
  {
    n: "03",
    title: "Get pinged when rivals show up",
    body: "Exact quote + speaker to Slack. One click to HubSpot/Salesforce.",
    detail: "Slack · HubSpot · Salesforce",
  },
] as const;

function section() {
  const { container } = render(<HowItWorks />);
  const el = container.querySelector("section") as HTMLElement;
  expect(el).not.toBeNull();
  return { container, el, scope: within(el) };
}

describe("HowItWorks D1 visuals", () => {
  it("keeps header, titles, bodies, STEP labels, and mono footers verbatim", () => {
    const { scope } = section();
    expect(scope.getByText("How it works")).toBeDefined();
    expect(
      scope.getByRole("heading", {
        name: /from raw recording to crm-ready notes/i,
      }),
    ).toBeDefined();
    for (const step of STEPS) {
      expect(scope.getByText(step.title)).toBeDefined();
      expect(scope.getByText(step.body)).toBeDefined();
      expect(scope.getByText(step.detail)).toBeDefined();
      expect(scope.getByText(`STEP ${step.n}`)).toBeDefined();
    }
  });

  it("keeps the 3 doppel card shells in a 3-col grid", () => {
    const { el } = section();
    expect(el.querySelectorAll(".doppel-outer").length).toBe(3);
    expect(el.querySelectorAll(".doppel-inner").length).toBe(3);
    expect(el.querySelector(".grid.md\\:grid-cols-3")).not.toBeNull();
  });

  it("renders the dropzone mini (MP3 / Record / Google Meet)", () => {
    section();
    const visual = screen.getByTestId("how-visual-dropzone");
    expect(visual).toBeDefined();
    const v = within(visual as HTMLElement);
    expect(v.getByText("MP3")).toBeDefined();
    expect(v.getByText("Record")).toBeDefined();
    expect(v.getByText("Google Meet")).toBeDefined();
    expect(visual.querySelector(".border-dashed")).not.toBeNull();
    expect(visual.className).toContain("bg-film-cream");
  });

  it("renders the transcript-lines mini (Transcript / Summary / Owners + dates)", () => {
    section();
    const visual = screen.getByTestId("how-visual-transcript");
    expect(visual).toBeDefined();
    const v = within(visual as HTMLElement);
    expect(v.getByText("Transcript")).toBeDefined();
    expect(v.getByText("Summary")).toBeDefined();
    expect(v.getByText("Owners + dates")).toBeDefined();
  });

  it("renders the slack-ping mini (Slack + channel chip + CRM stamp)", () => {
    section();
    const visual = screen.getByTestId("how-visual-slack-ping");
    expect(visual).toBeDefined();
    const v = within(visual as HTMLElement);
    expect(v.getByText("Slack")).toBeDefined();
    expect(v.getByText("#deal-room")).toBeDefined();
    expect(v.getByText("HubSpot · Salesforce")).toBeDefined();
  });

  it("stays a coded server component: no client JS, no binaries", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/how-it-works.tsx"),
      "utf8",
    );
    expect(src).not.toContain('"use client"');
    expect(src).not.toContain("use client");
    expect(src).not.toMatch(/<img|<Image|\.png|\.jpg/);
  });
});
