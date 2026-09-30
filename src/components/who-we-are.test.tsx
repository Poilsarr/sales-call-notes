import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { WhoWeAre } from "@/components/who-we-are";

const PILLARS: Array<[string, string]> = [
  [
    "What we do",
    "Gauge turns every sales call into structured notes, owners, and follow-ups — with a virtual competitor signal the second a rival is named.",
  ],
  [
    "Our goal",
    "No rep ever loses a deal to a competitor nobody wrote down. Every mention becomes evidence, every deal stays visible.",
  ],
  [
    "What we achieve",
    "12 beta teams run 500+ calls through Gauge — summaries in under 60 seconds, Slack pings with exact quotes, one-click CRM push.",
  ],
];

describe("WhoWeAre", () => {
  it("keeps the track-section shell, eyebrow, H2, and sub verbatim", () => {
    const { container } = render(<WhoWeAre />);
    const el = container.querySelector(
      'section[data-track-section="who-we-are"]',
    ) as HTMLElement;
    expect(el).not.toBeNull();
    expect(el.getAttribute("aria-labelledby")).toBe("who-we-are-heading");
    const scope = within(el);
    expect(scope.getByText("Who we are")).toBeDefined();
    expect(
      scope.getByRole("heading", {
        name: /reps talk\. gauge remembers everything\./i,
      }),
    ).toBeDefined();
    expect(
      scope.getByText(
        /we are the team behind the virtual competitor signal/i,
      ),
    ).toBeDefined();
  });

  it("renders 3 pillars with verbatim titles/descs inside doppel shells", () => {
    const { container } = render(<WhoWeAre />);
    const el = container.querySelector(
      'section[data-track-section="who-we-are"]',
    ) as HTMLElement;
    const scope = within(el);
    for (const [title, desc] of PILLARS) {
      expect(scope.getByText(title)).toBeDefined();
      expect(scope.getByText(desc)).toBeDefined();
    }
    expect(el.querySelectorAll(".doppel-outer").length).toBe(3);
    expect(el.querySelectorAll(".doppel-inner").length).toBe(3);
  });

  it("gives each card a distinct pastel fill + larger tinted icon tile", () => {
    const { container } = render(<WhoWeAre />);
    const el = container.querySelector(
      'section[data-track-section="who-we-are"]',
    ) as HTMLElement;
    for (const tint of [
      "section-tint-blue",
      "section-tint-peach",
      "section-tint-mint",
    ]) {
      expect(el.querySelector(`.doppel-inner.${tint}`)).not.toBeNull();
    }
    // Larger icon tiles (w-12 h-12), one per pillar — no small w-10 chips left.
    expect(el.querySelectorAll(".w-12.h-12").length).toBe(3);
    const src = readFileSync(
      join(process.cwd(), "src/components/who-we-are.tsx"),
      "utf8",
    );
    expect(src).not.toContain("w-10 h-10");
  });

  it("keeps the beta proof line + demo link", () => {
    const { container } = render(<WhoWeAre />);
    const el = container.querySelector(
      'section[data-track-section="who-we-are"]',
    ) as HTMLElement;
    const scope = within(el);
    expect(
      scope.getByText(/12 beta teams · 500\+ calls · summaries in ~60s/i),
    ).toBeDefined();
    const link = el.querySelector('a[href="/demo"]');
    expect(link).not.toBeNull();
  });

  it("stays server-side: no client JS, no binaries", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/who-we-are.tsx"),
      "utf8",
    );
    expect(src).not.toContain('"use client"');
    expect(src).not.toMatch(/\.(png|jpg|svg|mp4)/);
  });
});
