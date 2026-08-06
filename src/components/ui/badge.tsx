"use client";

import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

const badgeClasses: Record<BadgeVariant, string> = {
  default: "bg-white/5 text-white/60 border-white/10",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-linear-indigo/10 text-linear-indigo border-linear-indigo/20",
  outline: "bg-transparent text-white/50 border-white/10",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold uppercase tracking-wider border",
        badgeClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
