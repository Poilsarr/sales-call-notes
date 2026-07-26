"use client";

import { cn } from "@/lib/cn";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 text-base",
};

const sizePixels = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        width={sizePixels[size]}
        height={sizePixels[size]}
        className={cn("rounded-full object-cover ring-1 ring-white/10", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-medium bg-linear-indigo/15 text-linear-indigo ring-1 ring-linear-indigo/20",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
