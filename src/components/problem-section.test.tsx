import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ProblemSection from "@/components/problem-section";
import { HOMEPAGE_COPY } from "@/lib/homepage-copy";

function section() {
  const { container } = render(<ProblemSection />);
  const el = container.querySelector(
    'section[aria-labelledby="problem-heading"]',
  ) as HTMLElement;
  expect(el).not.toBeNull();
  return { container, el, scope: within(el) };
}

describe("ProblemSection D1 visuals", () => {
  it("keeps eyebrow, title, and all verbatim bullet titles/descs", () => {
    const { scope } = section();
    expect(scope.getByText(HOMEPAGE_COPY.problem.eyebrow)).toBeDefined();
    expect(
      scope.getByRole("heading", { name: HOMEPAGE_COPY.problem.title }),
    ).toBeDefined();
    for (const bullet of HOMEPAGE_COPY.problem.bullets) {
      expect(scope.getByText(bullet.title)).toBeDefined();
      expect(scope.getByText(bullet.desc)).toBeDefined();
    }
  });

  it("keeps the 3 doppel card shells", () => {
    const { el } = section();
    expect(el.querySelectorAll(".doppel-outer").length).toBe(3);
    expect(el.querySelectorAll(".doppel-inner").length).toBe(3);
  });

  it("renders the quiet missed-line visual (calm mono stamp, testid kept)", () => {
    section();
    const visual = screen.getByTestId("problem-visual-missed-line");
    expect(visual).toBeDefined();
    expect(visual.querySelector("svg")).toBeNull();
    expect(visual.querySelector("img")).toBeNull();
    expect(visual.className).not.toContain("bg-film-cream");
    expect(within(visual as HTMLElement).getByText(/rival named/i)).toBeDefined();
  });

  it("renders the quiet hours visual (calm mono stamp, testid kept)", () => {
    section();
    const visual = screen.getByTestId("problem-visual-hours-dial");
    expect(visual).toBeDefined();
    expect(visual.querySelector("svg")).toBeNull();
    expect(visual.querySelector("img")).toBeNull();
    expect(visual.className).not.toContain("bg-film-cream");
    expect(within(visual as HTMLElement).getByText(/5h/i)).toBeDefined();
  });

  it("renders the quiet follow-ups visual (calm mono stamp, testid kept)", () => {
    section();
    const visual = screen.getByTestId("problem-visual-slipping-calendar");
    expect(visual).toBeDefined();
    expect(visual.querySelector("svg")).toBeNull();
    expect(visual.querySelector("img")).toBeNull();
    expect(visual.className).not.toContain("bg-film-cream");
    expect(within(visual as HTMLElement).getByText(/follow-ups/i)).toBeDefined();
  });

  it("stays a coded server component: no client JS, no binaries", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/problem-section.tsx"),
      "utf8",
    );
    expect(src).not.toContain('"use client"');
    expect(src).not.toContain("use client");
    expect(src).not.toMatch(/<img|<Image|\.png|\.jpg/);
  });
});
