"use client";

import { cn } from "@/lib/cn";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface NavTabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function NavTabs({ tabs, active, onChange, orientation = "horizontal", className }: NavTabsProps) {
  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "flex",
        isVertical ? "flex-col gap-1" : "flex-wrap items-center gap-2",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-all rounded-xl",
              isVertical ? "px-3 py-2.5 w-full justify-start" : "px-4 py-2",
              isActive
                ? "bg-white text-linear-black"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
