import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PricingCalculator from "@/components/pricing-calculator";

function priceFor(name: string): string {
  const nameEl = screen.getByText(name);
  const row = nameEl.parentElement!.parentElement!;
  return row.textContent!.match(/\$\d+(\.\d+)?/)?.[0] ?? "";
}

function slider(): HTMLInputElement {
  return screen.getByRole("slider") as HTMLInputElement;
}

describe("PricingCalculator — honest plan for the team size", () => {
  it("quotes Gauge Pro $9 at 5 reps (Pro caps at 5 seats)", () => {
    render(<PricingCalculator />);
    expect(slider().value).toBe("5");
    expect(priceFor("Gauge Pro")).toBe("$9");
    expect(screen.getByText("Up to 5 reps")).toBeDefined();
  });

  it("switches to Gauge Business $29 as soon as the team exceeds 5 reps", () => {
    render(<PricingCalculator />);
    fireEvent.change(slider(), { target: { value: "6" } });
    expect(priceFor("Gauge Business")).toBe("$29");
    expect(screen.getByText("Unlimited seats — Business")).toBeDefined();
    expect(screen.queryByText("Gauge Pro")).toBeNull();
  });

  it("stays on Business $29 at the top of the slider (20 reps)", () => {
    render(<PricingCalculator />);
    fireEvent.change(slider(), { target: { value: "20" } });
    expect(priceFor("Gauge Business")).toBe("$29");
  });

  it("computes savings against the plan the team can actually buy", () => {
    render(<PricingCalculator />);
    fireEvent.change(slider(), { target: { value: "10" } });
    // Fireflies: 10 × $10 = $100/mo; Business $29 → (100 − 29) × 12 = $852/yr
    expect(screen.getByText("Save $852 per year vs Fireflies")).toBeDefined();
  });

  it("keeps Pro math at 5 reps: (50 − 9) × 12 = $492/yr", () => {
    render(<PricingCalculator />);
    expect(screen.getByText("Save $492 per year vs Fireflies")).toBeDefined();
  });
});
