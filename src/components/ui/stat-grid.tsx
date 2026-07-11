"use client";

import { cn } from "@/lib/cn";

interface Stat {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  accent?: string;
}

interface StatGridProps {
  stats: Stat[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ stats, columns = 4, className }: StatGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {stats.map((stat, i) => (
        <div
          key={i}
          className="rounded-2xl bg-linear-surface border border-linear-secondary p-5 flex flex-col justify-between min-h-[120px]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{stat.label}</span>
            {stat.icon && <span className={cn("text-white/30", stat.accent)}>{stat.icon}</span>}
          </div>
          <div>
            <div className="text-2xl font-semibold text-white tracking-tight">{stat.value}</div>
            {stat.change && (
              <div
                className={cn(
                  "text-xs mt-1",
                  stat.changeType === "positive" && "text-emerald-400",
                  stat.changeType === "negative" && "text-red-400",
                  stat.changeType === "neutral" && "text-white/40",
                  !stat.changeType && "text-white/40",
                )}
              >
                {stat.change}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
