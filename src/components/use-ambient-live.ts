"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient-loop pause. `data-live` starts "false" so SSR paint is a frozen
 * frame; an IntersectionObserver flips it while the section is on screen.
 * globals.css freezes `[data-live="false"] *` keyframes, and the global
 * reduced-motion catch-all stops them entirely.
 */
export function useAmbientLive<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    // jsdom/headless environments may not provide either API; degrade to a
    // static paint there (SSR-equivalent), never throw.
    if (typeof window.matchMedia !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        sec.dataset.live = visible ? "true" : "false";
      },
      { threshold: 0.12 },
    );
    io.observe(sec);

    return () => io.disconnect();
  }, []);

  return ref;
}
