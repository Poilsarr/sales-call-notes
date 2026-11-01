"use client";

import type { ReactNode } from "react";
import { useAmbientLive } from "@/components/use-ambient-live";

type LiveProps = {
  className?: string;
  id?: string;
  children: ReactNode;
};

/**
 * Ambient-band shells for the extension page. Both render with
 * `data-live="false"` so the SSR paint is a frozen frame; useAmbientLive
 * flips it to "true" only while the element is on screen (and never under
 * reduced motion). globals.css freezes `[data-live="false"] *` keyframes,
 * so Chrome-extension artboard loops (REC blink, pipe dot, breathing orb)
 * stay paused until observed.
 */
export function LiveSection({ className, id, children }: LiveProps) {
  const ref = useAmbientLive<HTMLElement>();
  return (
    <section ref={ref} data-live="false" id={id} className={className}>
      {children}
    </section>
  );
}

export function LiveDiv({ className, id, children }: LiveProps) {
  const ref = useAmbientLive<HTMLDivElement>();
  return (
    <div ref={ref} data-live="false" id={id} className={className}>
      {children}
    </div>
  );
}
