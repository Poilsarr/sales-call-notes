import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TeamShowcase } from "@/components/team-showcase";
import { HeroEvidenceStack } from "@/components/hero-evidence-stack";
import { TEAM_MEMBERS, ADVISORY_NOTE } from "@/lib/team";

function teamSection() {
  const { container } = render(<TeamShowcase />);
  const el = container.querySelector(
    'section[data-track-section="team"]'
  ) as HTMLElement;
  expect(el).not.toBeNull();
  return { container, el, scope: within(el) };
}

function evidenceSection() {
  const { container } = render(<HeroEvidenceStack />);
  const el = container.querySelector(
    '[data-testid="hero-evidence-stack"]'
  ) as HTMLElement;
  expect(el).not.toBeNull();
  return { container, el, scope: within(el) };
}

describe("VISUAL-DENSITY D4 — TeamShowcase", () => {
  it("keeps heading, advisory note, and mailto CTA verbatim", () => {
    const { scope } = teamSection();
    expect(
      scope.getByRole("heading", {
        name: /the team building your virtual competitor radar/i,
      })
    ).toBeDefined();
    expect(scope.getByText(ADVISORY_NOTE)).toBeDefined();
    const cta = scope.getByRole("link", { name: /talk to the team/i });
    expect(cta.getAttribute("href")).toBe("mailto:hello@usegauge.com");
  });

  it("renders every member with verbatim role/name/focus and no photos", () => {
    const { container, scope } = teamSection();
    expect(container.querySelector("img")).toBeNull();
    for (const m of TEAM_MEMBERS) {
      expect(scope.getByText(m.role)).toBeDefined();
      expect(scope.getByText(m.name)).toBeDefined();
      expect(scope.getByText(m.focus)).toBeDefined();
      expect(scope.getByText(m.initials)).toBeDefined();
    }
  });

  it("uses large gradient avatar chips with distinct hues + white bold initials", () => {
    teamSection();
    const avatars = TEAM_MEMBERS.map((m) =>
      screen.getByTestId(`team-avatar-${m.initials}`)
    );
    expect(avatars).toHaveLength(TEAM_MEMBERS.length);
    const gradients = new Set<string>();
    for (const avatar of avatars) {
      const cls = avatar.getAttribute("class") ?? "";
      // P2 compat shell kept + large responsive size + gradient + white bold.
      expect(cls).toMatch(/w-11/);
      expect(cls).toMatch(/h-11/);
      expect(cls).toMatch(/rounded-full/);
      expect(cls).toMatch(/sm:w-14/);
      expect(cls).toMatch(/bg-gradient-to-br/);
      expect(cls).toMatch(/text-white/);
      expect(cls).toMatch(/font-bold/);
      const gradient = cls.match(/from-\[[^\]]+\] to-\[[^\]]+\]/)?.[0];
      expect(gradient).toBeDefined();
      gradients.add(gradient!);
    }
    // Distinct hue per member.
    expect(gradients.size).toBe(TEAM_MEMBERS.length);
  });

  it("ships role pills and hover-ring cards", () => {
    const { el } = teamSection();
    const pills = el.querySelectorAll("span.rounded-full.border");
    expect(pills.length).toBeGreaterThanOrEqual(TEAM_MEMBERS.length);
    const cards = el.querySelectorAll("li.doppel-outer");
    expect(cards.length).toBe(TEAM_MEMBERS.length);
    for (const card of cards) {
      expect(card.getAttribute("class")).toMatch(/hover:ring-2/);
    }
  });

  it("source stays photo-free and credential-free", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/team-showcase.tsx"),
      "utf8"
    );
    expect(src).not.toContain("next/image");
    expect(src).not.toContain("<Image");
    expect(src).not.toContain("m.photo");
    expect(src).not.toContain("use client");
  });
});

describe("VISUAL-DENSITY D4 — HeroEvidenceStack", () => {
  it("keeps header, card copy, and footer verbatim", () => {
    const { scope } = evidenceSection();
    expect(
      scope.getByText("Live evidence · from call 00:14:22 · conf 0.96")
    ).toBeDefined();
    expect(
      scope.getByRole("heading", { name: /every signal ships with proof/i })
    ).toBeDefined();
    for (const title of [
      "The exact line, with speaker and timestamp",
      "#deal-room-acme · Competitor detected: Gong (0.96)",
      "1-click HubSpot → Salesforce",
    ]) {
      expect(
        scope.getAllByText(title).length,
        `expected verbatim title: ${title}`
      ).toBeGreaterThanOrEqual(1);
    }
    for (const step of [
      "01 · Transcript proof",
      "02 · Slack ping",
      "03 · CRM sync",
    ]) {
      expect(
        scope.getAllByText(step).length,
        `expected verbatim step: ${step}`
      ).toBeGreaterThanOrEqual(1);
    }
    expect(scope.getByText("Health 8.2")).toBeDefined();
  });

  it("renders a mini mock strip atop each of the 3 cards", () => {
    evidenceSection();
    const transcript = screen.getByTestId("evidence-visual-transcript");
    const slack = screen.getByTestId("evidence-visual-slack");
    const crm = screen.getByTestId("evidence-visual-crm");
    // Condensed product-visual patterns: cream strip + mono header.
    for (const visual of [transcript, slack, crm]) {
      expect(visual.getAttribute("class")).toMatch(/bg-film-cream/);
    }
    // Transcript line: quote + speaker pill + timestamp.
    expect(
      within(transcript).getByText("Live summary")
    ).toBeDefined();
    expect(
      within(transcript).getByText("Sarah Chen")
    ).toBeDefined();
    // Slack message: channel + rival + confidence bar.
    expect(
      within(slack).getByText("Rival signal")
    ).toBeDefined();
    expect(
      within(slack).getByText("Rival: Gong")
    ).toBeDefined();
    expect(
      within(slack).getByText("#deal-room-acme")
    ).toBeDefined();
    const bar = within(slack).getByRole("progressbar", {
      name: /Gong confidence/,
    });
    expect(bar.getAttribute("aria-valuenow")).toBe("96");
    // CRM field rows.
    const crmScope = within(crm);
    expect(crmScope.getByText("CRM sync")).toBeDefined();
    expect(crmScope.getByText("HubSpot → Salesforce")).toBeDefined();
    for (const label of ["Deal", "Owner", "Next step"]) {
      expect(crmScope.getByText(label)).toBeDefined();
    }
  });

  it("keeps doppel shells, stagger, and accent icon tiles", () => {
    const { el } = evidenceSection();
    expect(el.querySelectorAll(".doppel-outer").length).toBe(3);
    expect(el.querySelector(".animate-stagger-1")).not.toBeNull();
    expect(el.querySelector(".animate-stagger-2")).not.toBeNull();
    expect(el.querySelector(".animate-stagger-3")).not.toBeNull();
    const src = readFileSync(
      join(process.cwd(), "src/components/hero-evidence-stack.tsx"),
      "utf8"
    );
    expect(src).toContain("#F26522");
    expect(src).not.toContain("use client");
  });
});
