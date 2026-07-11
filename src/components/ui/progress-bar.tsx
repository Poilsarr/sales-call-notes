"use client";

import { cn } from "@/lib/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  sublabel?: string;
  color?: "indigo" | "orange" | "emerald" | "red" | "amber";
  size?: "sm" | "md";
  className?: string;
}

const colorMap = {
  indigo: "bg-linear-indigo",
  orange: "bg-[#F26522]",
  emerald: "bg-emerald-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  sublabel,
  color = "indigo",
  size = "md",
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      {(label || sublabel) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm text-white/70">{label}</span>}
          {sublabel && <span className="text-xs text-white/40">{sublabel}</span>}
        </div>
      )}
      <div className={cn("w-full rounded-full bg-white/5 overflow-hidden", size === "sm" ? "h-1.5" : "h-2")}>
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
