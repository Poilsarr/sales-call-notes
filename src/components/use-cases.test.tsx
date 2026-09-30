import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import UseCases from "@/components/use-cases";

const TITLES = [
  "Discovery",
  "Procurement review",
  "Q3 vendor review",
  "Coaching",
] as const;

const BODIES = [
  "Catch every rival name early — exact quote + speaker, before it becomes an objection.",
  "Send the one-pager on time — owners, dates, and decisions pulled from the call.",
  "Walk in with history — every mention, commitment, and follow-up, not guesses.",
  "Talk time + sentiment per rep — see who listens, who pitches, who closes.",
] as const;

describe("UseCases", () => {
  it("keeps the section shell, eyebrow, H2, and sub verbatim", () => {
    const { container } = render(<UseCases />);
    const section = container.querySelector("section");
    expect(section).not.toBeNull();
    const scope = within(section as HTMLElement);
    expect(scope.getByText("Where it pays off")).toBeDefined();
    expect(
      scope.getByRole("heading", {
        name: /four calls you already have\. now they work harder\./i,
      }),
    ).toBeDefined();
    expect(
      scope.getByText(
        /pick your moment — gauge turns it into notes, next steps, and signal\./i,
      ),
    ).toBeDefined();
  });

  it("renders 4 cards with verbatim titles/bodies inside doppel shells", () => {
    const { container } = render(<UseCases />);
    const section = container.querySelector("section") as HTMLElement;
    const scope = within(section);
    for (const title of TITLES) {
      expect(scope.getByText(title)).toBeDefined();
    }
    for (const body of BODIES) {
      expect(scope.getByText(body)).toBeDefined();
    }
    expect(section.querySelectorAll(".doppel-outer").length).toBe(4);
    expect(section.querySelectorAll(".doppel-inner").length).toBe(4);
  });

  it("renders the Discovery rival-quote-chip visual", () => {
    render(<UseCases />);
    const visual = screen.getByTestId("usecase-discovery-visual");
    const v = within(visual as HTMLElement);
    expect(v.getByText("Rival signal")).toBeDefined();
    expect(v.getByText("Rival: Gong")).toBeDefined();
    expect(v.getByText(/evaluating Gong/i)).toBeDefined();
  });

  it("renders the Procurement one-pager visual with THU badge", () => {
    render(<UseCases />);
    const visual = screen.getByTestId("usecase-procurement-visual");
    const v = within(visual as HTMLElement);
    expect(v.getByText("One-pager")).toBeDefined();
    expect(v.getByText("THU")).toBeDefined();
    expect(v.getByText("Sarah Chen")).toBeDefined();
  });

  it("renders the Q3 review timeline-dots visual", () => {
    render(<UseCases />);
    const visual = screen.getByTestId("usecase-review-visual");
    const v = within(visual as HTMLElement);
    expect(v.getByText("Deal history")).toBeDefined();
    for (const label of ["Mention", "Commit", "Follow-up"]) {
      expect(v.getByText(label)).toBeDefined();
    }
  });

  it("renders the Coaching talk-ratio bars visual with a11y progressbars", () => {
    render(<UseCases />);
    const visual = screen.getByTestId("usecase-coaching-visual");
    const v = within(visual as HTMLElement);
    expect(v.getByText("Talk ratio")).toBeDefined();
    const rep = v.getByRole("progressbar", { name: /rep talk time/i });
    expect(rep.getAttribute("aria-valuenow")).toBe("62");
    const buyer = v.getByRole("progressbar", { name: /buyer talk time/i });
    expect(buyer.getAttribute("aria-valuenow")).toBe("38");
  });

  it("stays server-side: no client JS, no binaries", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/use-cases.tsx"),
      "utf8",
    );
    expect(src).not.toContain('"use client"');
    expect(src).not.toMatch(/<img|<Image|video|числи/);
    expect(src).not.toMatch(/\.(png|jpg|svg|mp4)/);
  });
});
