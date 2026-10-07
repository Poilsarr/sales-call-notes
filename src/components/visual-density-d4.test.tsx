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
  it("keeps header, deduped captions, and footer verbatim", () => {
    const { scope } = evidenceSection();
    expect(
      scope.getByText("Live evidence · from call 00:14:22 · conf 0.96")
    ).toBeDefined();
    expect(
      scope.getByRole("heading", { name: /every signal ships with proof/i })
    ).toBeDefined();
    for (const caption of [
      "The exact line, with speaker and timestamp",
      "Competitor detected: Gong (0.96)",
      "1-click HubSpot → Salesforce",
    ]) {
      expect(
        scope.getAllByText(caption).length,
        `expected caption: ${caption}`
      ).toBeGreaterThanOrEqual(1);
      // Caption is a single short line (≤8 words).
      expect(caption.split(/\s+/).length).toBeLessThanOrEqual(8);
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
    // Dedupe: removed lower text bodies must not render.
    for (const removed of [
      "Rival names highlighted the second they drop",
      "The whole deal room sees it before the call ends",
      "Deal health 8.2, rival tracked call-over-call",
      "#deal-room-acme · Competitor detected: Gong (0.96)",
    ]) {
      expect(
        scope.queryByText(removed),
        `expected removed body gone: ${removed}`
      ).toBeNull();
    }
  });

  it("renders product stills atop each of the 3 cards", () => {
    evidenceSection();
    const transcript = screen.getByTestId("evidence-visual-transcript");
    const slack = screen.getByTestId("evidence-visual-slack");
    const crm = screen.getByTestId("evidence-visual-crm");
    for (const visual of [transcript, slack, crm]) {
      expect(visual.getAttribute("class")).toMatch(/product-chrome/);
      const img = visual.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toMatch(/^\/product\//);
    }
    expect(transcript.querySelector("img")?.getAttribute("src")).toContain(
      "transcript-proof"
    );
    expect(slack.querySelector("img")?.getAttribute("src")).toContain(
      "slack-ping"
    );
    expect(crm.querySelector("img")?.getAttribute("src")).toContain("crm-sync");
  });

  it("keeps doppel shells, single grid reveal, and accent (no icon tiles)", () => {
    const { el } = evidenceSection();
    expect(el.querySelectorAll(".doppel-outer").length).toBe(3);
    // Dead stagger classes removed (zero defs in globals); single grid-level reveal.
    expect(el.querySelector(".animate-stagger-1")).toBeNull();
    expect(el.querySelector(".animate-stagger-2")).toBeNull();
    expect(el.querySelector(".animate-stagger-3")).toBeNull();
    expect(el.querySelector(".product-still-reveal")).not.toBeNull();
    expect(el.querySelector(".animate-pulse")).toBeNull();
    const src = readFileSync(
      join(process.cwd(), "src/components/hero-evidence-stack.tsx"),
      "utf8"
    );
    expect(src).toContain("#F26522");
    expect(src).not.toContain("use client");
    expect(src).not.toContain("lucide-react");
    expect(src).not.toContain("shadow-[8px_8px_0_#131316]");
  });
});
