import { describe, it, expect } from "vitest";
import {
  computeRoi,
  DEFAULT_INPUTS,
  formatUSD,
  formatHours,
  PRO_PLAN_MONTHLY_USD,
} from "@/lib/roi";

describe("computeRoi", () => {
  it("default inputs → 5.3h saved/mo at $50/hr", () => {
    const r = computeRoi(DEFAULT_INPUTS);
    // 40 calls × 8 min / 60 = 5.333...
    expect(r.hoursSavedPerMonth).toBeCloseTo(5.333, 2);
    expect(r.dollarsSavedPerMonth).toBeCloseTo(266.67, 1);
  });

  it("multiplies saved hours by hourly cost", () => {
    const r = computeRoi({
      callsPerMonth: 100,
      minutesPerCall: 30,
      minutesToWriteNotes: 10,
      hourlyCost: 80,
    });
    // 100 * 10 / 60 = 16.667 h/mo × $80 = $1333.33
    expect(r.hoursSavedPerMonth).toBeCloseTo(16.667, 2);
    expect(r.dollarsSavedPerMonth).toBeCloseTo(1333.33, 1);
  });

  it("annual is 12x monthly", () => {
    const r = computeRoi(DEFAULT_INPUTS);
    expect(r.dollarsSavedPerYear).toBeCloseTo(r.dollarsSavedPerMonth * 12, 5);
  });

  it("paybackDays null when monthly savings is zero", () => {
    const r = computeRoi({
      callsPerMonth: 0,
      minutesPerCall: 0,
      minutesToWriteNotes: 0,
      hourlyCost: 50,
    });
    expect(r.paybackDays).toBeNull();
    expect(r.breakEven).toBe(false);
  });

  it("paybackDays = round((9 / monthlySaved) * 30)", () => {
    // $30/mo saved → 9/30*30 = 9 days
    const r = computeRoi({
      callsPerMonth: 100,
      minutesPerCall: 5,
      minutesToWriteNotes: 1,
      hourlyCost: 18,
    });
    // 100 * 1 / 60 = 1.667h × $18 = $30/mo
    expect(r.dollarsSavedPerMonth).toBeCloseTo(30, 1);
    expect(r.paybackDays).toBe(9);
    expect(r.breakEven).toBe(true);
  });

  it("breakEven true when monthly savings ≥ $9", () => {
    expect(
      computeRoi({
        callsPerMonth: 10,
        minutesPerCall: 10,
        minutesToWriteNotes: 5,
        hourlyCost: 20,
      }).breakEven,
    ).toBe(true);
  });

  it("breakEven false when monthly savings < $9", () => {
    expect(
      computeRoi({
        callsPerMonth: 1,
        minutesPerCall: 10,
        minutesToWriteNotes: 1,
        hourlyCost: 10,
      }).breakEven,
    ).toBe(false);
  });

  it("handles negative or NaN inputs as 0", () => {
    const r = computeRoi({
      callsPerMonth: -5,
      minutesPerCall: Number.NaN,
      minutesToWriteNotes: Infinity,
      hourlyCost: -100,
    });
    expect(r.hoursSavedPerMonth).toBe(0);
    expect(r.dollarsSavedPerMonth).toBe(0);
    expect(r.breakEven).toBe(false);
  });

  it("Pro plan price constant is $9", () => {
    expect(PRO_PLAN_MONTHLY_USD).toBe(9);
  });
});

describe("formatters", () => {
  it("formatUSD rounds to nearest dollar", () => {
    expect(formatUSD(0)).toBe("$0");
    expect(formatUSD(1234.56)).toBe("$1,235");
    expect(formatUSD(99.4)).toBe("$99");
  });
  it("formatHours keeps 1 decimal", () => {
    expect(formatHours(5)).toBe("5.0");
    expect(formatHours(5.333)).toBe("5.3");
  });
});