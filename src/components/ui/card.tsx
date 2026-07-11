"use client";

import { cn } from "@/lib/cn";

type CardVariant = "default" | "elevated" | "ghost" | "inset" | "danger" | "accent";

const cardClasses: Record<CardVariant, string> = {
  default: "bg-linear-surface border-linear-secondary",
  elevated: "bg-linear-surface border-linear-secondary shadow-[0_1px_3px_rgba(0,0,0,0.3)]",
  ghost: "bg-transparent border-transparent",
  inset: "bg-linear-black border-linear-secondary",
  danger: "bg-red-500/[0.03] border-red-500/10",
  accent: "bg-linear-indigo/[0.06] border-linear-indigo/20",
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: CardVariant;
}

export function Card({ children, className, variant = "default", ...props }: CardProps) {
  return (
    <div className={cn("rounded-2xl border transition-colors", cardClasses[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-6 pt-6 pb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-medium text-white tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-white/40 mt-1 leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 pb-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-3 px-6 pb-6 pt-2", className)} {...props}>
      {children}
    </div>
  );
}
