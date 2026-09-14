"use client";

import { useEffect } from "react";

/**
 * Mount-once IntersectionObserver that adds `is-visible` to any element
 * with class `reveal` when it enters the viewport. Lets pages stay
 * server-rendered (no useState/useEffect at the page level) while
 * keeping the reveal-on-scroll animation.
 *
 * PR-2 analytics: additionally fires a fire-once `section_view`
 * `{section}` event for any observed element carrying a
 * `data-track-section` attribute. Tracking uses a dynamic import so
 * this client island never pulls analytics into server bundles.
 *
 * Usage:
 *   <main>
 *     <h2 className="reveal">...</h2>
 *     <section data-track-section="pricing">...</section>
 *     <RevealObserver />
 *   </main>
 */
export default function RevealObserver() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            const section = (e.target as HTMLElement).dataset?.trackSection;
            if (section) {
              // PR-2: pairs with C1 analytics.ts extension
              const name = section;
              void import("@/lib/analytics")
                .then((m) => {
                  const fire = m.trackEvent as unknown as (
                    event: string,
                    properties?: Record<string, string | number | boolean>,
                  ) => void;
                  fire("section_view", { section: name });
                })
                .catch(() => {});
            }
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.5 },
    );
    document
      .querySelectorAll(".reveal, [data-track-section]")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}