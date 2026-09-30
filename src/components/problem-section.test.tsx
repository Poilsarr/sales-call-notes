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

  it("renders the redacted-transcript visual (black bar + timestamp)", () => {
    section();
    const visual = screen.getByTestId("problem-visual-missed-line");
    expect(visual).toBeDefined();
    const v = within(visual as HTMLElement);
    expect(v.getByText("Discovery")).toBeDefined();
    expect(v.getByText("30:42")).toBeDefined();
    const bar = visual.querySelector(
      '[data-testid="problem-redacted-bar"]',
    ) as HTMLElement;
    expect(bar).not.toBeNull();
    expect(bar.className).toContain("bg-film-ink");
    expect(visual.className).toContain("bg-film-cream");
  });

  it("renders the clock/5h dial visual", () => {
    section();
    const visual = screen.getByTestId("problem-visual-hours-dial");
    expect(visual).toBeDefined();
    const v = within(visual as HTMLElement);
    expect(v.getByText("5h")).toBeDefined();
    expect(visual.querySelector("svg")).not.toBeNull();
    expect(visual.className).toContain("bg-film-cream");
  });

  it("renders the slipping-calendar visual with late badge", () => {
    section();
    const visual = screen.getByTestId("problem-visual-slipping-calendar");
    expect(visual).toBeDefined();
    const v = within(visual as HTMLElement);
    expect(v.getByText("LATE")).toBeDefined();
    expect(v.getByText("one-pager")).toBeDefined();
    expect(v.getByText("Q3 review invite")).toBeDefined();
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
