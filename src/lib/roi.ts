/**
 * ROI math (pure, no React). Tested in src/test/roi.test.ts.
 *
 * Customer fills in their own numbers → we compute transparent math.
 * NO made-up "studies" or "average teams save X hours" claims.
 * The only number we control is the Pro plan price ($9/mo).
 */

export type RoiInputs = {
  callsPerMonth: number;
  minutesPerCall: number;
  minutesToWriteNotes: number;
  hourlyCost: number;
};

export type RoiOutput = {
  hoursSavedPerMonth: number;
  dollarsSavedPerMonth: number;
  dollarsSavedPerYear: number;
  paybackDays: number | null;
  breakEven: boolean;
};

export const DEFAULT_INPUTS: RoiInputs = {
  callsPerMonth: 40,
  minutesPerCall: 25,
  minutesToWriteNotes: 8,
  hourlyCost: 50,
};

export const PRO_PLAN_MONTHLY_USD = 9;

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_MONTH = 30;

export function computeRoi(inputs: RoiInputs): RoiOutput {
  const safe = {
    callsPerMonth: Number.isFinite(inputs.callsPerMonth) && inputs.callsPerMonth >= 0 ? inputs.callsPerMonth : 0,
    minutesPerCall: Number.isFinite(inputs.minutesPerCall) && inputs.minutesPerCall >= 0 ? inputs.minutesPerCall : 0,
    minutesToWriteNotes:
      Number.isFinite(inputs.minutesToWriteNotes) && inputs.minutesToWriteNotes >= 0
        ? inputs.minutesToWriteNotes
        : 0,
    hourlyCost: Number.isFinite(inputs.hourlyCost) && inputs.hourlyCost >= 0 ? inputs.hourlyCost : 0,
  };
  const hoursSavedPerMonth =
    (safe.callsPerMonth * safe.minutesToWriteNotes) / 60;
  const dollarsSavedPerMonth = hoursSavedPerMonth * safe.hourlyCost;
  const dollarsSavedPerYear = dollarsSavedPerMonth * 12;
  const breakEven = dollarsSavedPerMonth >= PRO_PLAN_MONTHLY_USD;
  const paybackDays =
    dollarsSavedPerMonth > 0
      ? Math.round((PRO_PLAN_MONTHLY_USD / dollarsSavedPerMonth) * DAYS_PER_MONTH)
      : null;
  return {
    hoursSavedPerMonth,
    dollarsSavedPerMonth,
    dollarsSavedPerYear,
    paybackDays,
    breakEven,
  };
}

export function formatUSD(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  const rounded = Math.round(n);
  return "$" + rounded.toLocaleString("en-US");
}

export function formatHours(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(1);
}