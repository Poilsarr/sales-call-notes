"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, ArrowRight } from "lucide-react";
import {
  computeRoi,
  DEFAULT_INPUTS,
  formatHours,
  formatUSD,
  type RoiInputs,
} from "@/lib/roi";

/**
 * ROI calculator (Level 5.4 marketing).
 *
 * Honest: every number in the output comes from inputs the user
 * controls. We do NOT cite industry studies or make claims about
 * average teams. The only constant we control is Pro plan price ($9/mo).
 */
export default function RoiCalculator() {
  const [inputs, setInputs] = useState<RoiInputs>(DEFAULT_INPUTS);
  const result = computeRoi(inputs);

  function update<K extends keyof RoiInputs>(key: K, raw: string) {
    const v = Number(raw);
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(v) ? v : 0 }));
  }

  return (
    <section className="bg-[#0a0a0b] text-white py-16 sm:py-20 lg:py-28 border-t border-white/5">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#F26522] mb-3">
            Calculator
          </p>
          <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em]">
            What does an SDR hour cost you?
          </h2>
          <p className="text-[14px] text-white/50 mt-3">
            Every number below is yours. Change any input and the math
            updates instantly. Estimates only — your actual time will vary.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
          {/* INPUTS */}
          <div className="space-y-4">
            <Field
              label="Calls per month"
              value={inputs.callsPerMonth}
              onChange={(v) => update("callsPerMonth", v)}
              min={0}
              max={1000}
            />
            <Field
              label="Avg minutes per call"
              value={inputs.minutesPerCall}
              onChange={(v) => update("minutesPerCall", v)}
              min={0}
              max={240}
            />
            <Field
              label="Minutes to write notes per call (today)"
              value={inputs.minutesToWriteNotes}
              onChange={(v) => update("minutesToWriteNotes", v)}
              min={0}
              max={60}
            />
            <Field
              label="Loaded SDR hourly cost ($)"
              value={inputs.hourlyCost}
              onChange={(v) => update("hourlyCost", v)}
              min={0}
              max={500}
            />
          </div>

          {/* OUTPUT */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 sm:p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Calculator size={18} className="text-[#F26522]" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                Your estimate
              </span>
            </div>

            <Row
              label="Hours back per month"
              value={`${formatHours(result.hoursSavedPerMonth)} h`}
            />
            <Row
              label="Dollars saved per month"
              value={formatUSD(result.dollarsSavedPerMonth)}
              accent
            />
            <Row
              label="Dollars saved per year"
              value={formatUSD(result.dollarsSavedPerYear)}
            />
            <Row
              label="Payback on $9/mo Pro"
              value={
                result.paybackDays === null
                  ? "—"
                  : result.paybackDays < 1
                    ? "< 1 day"
                    : `${result.paybackDays} day${result.paybackDays === 1 ? "" : "s"}`
              }
            />

            <div className="mt-6 pt-6 border-t border-white/10">
              {result.breakEven ? (
                <p className="text-[13px] text-white/70">
                  At these numbers, Pro pays for itself in{" "}
                  <span className="text-white font-semibold">
                    {result.paybackDays === null
                      ? "—"
                      : result.paybackDays < 1
                        ? "less than a day"
                        : `${result.paybackDays} day${result.paybackDays === 1 ? "" : "s"}`}
                  </span>
                  .
                </p>
              ) : (
                <p className="text-[13px] text-white/50">
                  At these numbers, Pro doesn&apos;t pay for itself yet.
                  Try the free tier and revisit when your call volume grows.
                </p>
              )}
              <Link
                href="/sign-up"
                className="mt-5 inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2"
              >
                <span>Start free</span>
                <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                  <ArrowRight size={13} className="text-[#F26522]" />
                </span>
              </Link>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-white/30 mt-8 max-w-2xl">
          Estimates only. Your actual time savings will vary based on
          call complexity, note format, and workflow. The math above
          is the same math, just done for you.
        </p>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (raw: string) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] uppercase tracking-[0.12em] text-white/40">
          {label}
        </span>
        <span className="text-[11px] text-white/30 font-mono">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full accent-[#F26522]"
      />
    </label>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-2">
      <span className="text-[12px] text-white/50">{label}</span>
      <span
        className={`tabular-nums ${accent ? "text-[#F26522] text-2xl font-semibold" : "text-white text-lg font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}