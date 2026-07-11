"use client";

import { cn } from "@/lib/cn";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function Section({ children, className, title, description, ...props }: SectionProps) {
  return (
    <section className={cn("mb-10", className)} {...props}>
      {(title || description) && (
        <div className="mb-5">
          {title && <h2 className="text-lg font-medium text-white tracking-tight">{title}</h2>}
          {description && <p className="text-sm text-white/40 mt-1">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
