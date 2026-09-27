import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RadarMoat from "@/components/radar-moat";

describe("RadarMoat — dark moat band", () => {
  it("renders the H2", () => {
    render(<RadarMoat />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Surface no notetaker has." })
    ).toBeInTheDocument();
  });

  it("renders 3 cards (live flag, battlecard, trends)", () => {
    const { container } = render(<RadarMoat />);
    const cards = container.querySelectorAll(".doppel-outer-dark");
    expect(cards).toHaveLength(3);
    expect(screen.getByText("Live flag")).toBeInTheDocument();
    expect(screen.getByText("Battlecard push")).toBeInTheDocument();
    expect(screen.getByText("Cross-call trends")).toBeInTheDocument();
  });

  it("wires CTAs to #demo and /sign-up", () => {
    render(<RadarMoat />);
    const demo = screen.getByRole("link", { name: "See radar live" });
    const signup = screen.getByRole("link", { name: "Start free" });
    expect(demo).toHaveAttribute("href", "#demo");
    expect(signup).toHaveAttribute("href", "/sign-up");
  });

  it("uses the dark section shell", () => {
    const { container } = render(<RadarMoat />);
    const section = container.querySelector(
      'section[data-track-section="radar-moat"]'
    );
    expect(section).not.toBeNull();
    expect(section?.className).toContain("bg-[#0a0a0b]");
  });

  it("declares no duplicate ids", () => {
    const { container } = render(<RadarMoat />);
    const withIds = Array.from(container.querySelectorAll("[id]"));
    const ids = withIds.map((el) => el.getAttribute("id"));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
