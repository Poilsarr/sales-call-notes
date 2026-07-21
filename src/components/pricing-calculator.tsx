"use client";

import { useState, useMemo } from "react";
import { Calculator, Users, ArrowRight, CheckCircle } from "lucide-react";

const GAUGE_PRO_MONTHLY = 9;
const FIREFLIES_PER_SEAT = 10;
const OTTER_PER_SEAT = 8.33;

function formatUSD(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default function PricingCalculator() {
  const [teamSize, setTeamSize] = useState(5);

  const { gauge, fireflies, otter, saveVsFireflies, saveVsOtter } = useMemo(() => {
    const gauge = GAUGE_PRO_MONTHLY;
    const fireflies = teamSize * FIREFLIES_PER_SEAT;
    const otter = teamSize * OTTER_PER_SEAT;
    return {
      gauge,
      fireflies,
      otter,
      saveVsFireflies: (fireflies - gauge) * 12,
      saveVsOtter: (otter - gauge) * 12,
    };
  }, [teamSize]);

  return (
    <section className="pb-12 sm:pb-16 px-5 sm:px-8 lg:px-12">
      <div className="max-w-[1440px] mx-auto">
        <div className="doppel-outer">
          <div className="doppel-inner p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12 items-start">
              {/* Left: headline + slider */}
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#F26522] mb-3">
                  <Calculator size={12} /> Cost comparison
                </div>
                <h3 className="text-[clamp(1.25rem,3vw,1.75rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
                  Flat-rate vs per-seat pricing
                </h3>
                <p className="text-[13px] text-gray-500 mb-8">
                  Move the slider to your team size and see why flat-rate wins as you grow.
                </p>

                <label className="block">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] uppercase tracking-[0.12em] text-gray-500 font-medium">
                      Team size
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                      <Users size={13} /> {teamSize} {teamSize === 1 ? "rep" : "reps"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className="w-full accent-[#F26522] h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: "#F26522" }}
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                    <span>1</span>
                    <span>10</span>
                    <span>20</span>
                  </div>
                </label>

                <p className="text-[11px] text-gray-400 mt-6">
                  Based on Fireflies Pro ($10/seat/mo) and Otter Pro ($8.33/seat/mo billed annually).
                  Gauge Pro is $9/mo flat for up to 5 reps.
                </p>
              </div>

              {/* Right: cost cards */}
              <div className="space-y-3">
                <CostRow
                  name="Gauge Pro"
                  price={gauge}
                  period="/month flat"
                  highlight
                  note="Up to 5 reps"
                />
                <CostRow
                  name="Fireflies.ai"
                  price={fireflies}
                  period="/month"
                  note={`${teamSize} seats × $10`}
                />
                <CostRow
                  name="Otter.ai"
                  price={otter}
                  period="/month"
                  note={`${teamSize} seats × $8.33`}
                />

                <div className="mt-5 p-4 rounded-xl bg-[#F26522]/[0.04] border border-[#F26522]/10">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-[#F26522] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">
                        Save {formatUSD(saveVsFireflies)} per year vs Fireflies
                      </p>
                      <p className="text-[12px] text-gray-500">
                        And {formatUSD(saveVsOtter)} per year vs Otter. That pays for a lot of closed deals.
                      </p>
                    </div>
                  </div>
                </div>

                <a
                  href="/sign-up"
                  className="mt-4 group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors"
                >
                  <span>Start free</span>
                  <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-transform group-hover:-rotate-45">
                    <ArrowRight size={13} className="text-[#F26522]" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CostRow({
  name,
  price,
  period,
  highlight,
  note,
}: {
  name: string;
  price: number;
  period: string;
  highlight?: boolean;
  note: string;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border ${
        highlight
          ? "bg-[#F26522]/[0.04] border-[#F26522]/20"
          : "bg-white border-gray-100"
      }`}
    >
      <div>
        <p className={`text-[13px] font-semibold ${highlight ? "text-[#F26522]" : "text-gray-900"}`}>
          {name}
        </p>
        <p className="text-[11px] text-gray-400">{note}</p>
      </div>
      <div className="text-right">
        <p className={`text-[18px] font-semibold tracking-tight ${highlight ? "text-[#F26522]" : "text-gray-900"}`}>
          {formatUSD(price)}
          <span className="text-[11px] font-normal text-gray-400 ml-1">{period}</span>
        </p>
      </div>
    </div>
  );
}
