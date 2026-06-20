"use client";

import { useEffect } from "react";

/**
 * Mount-once IntersectionObserver that adds `is-visible` to any element
 * with class `reveal` when it enters the viewport. Lets pages stay
 * server-rendered (no useState/useEffect at the page level) while
 * keeping the reveal-on-scroll animation.
 *
 * Usage:
 *   <main>
 *     <h2 className="reveal">...</h2>
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
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}