"use client";

import { Toaster } from "sonner";

/**
 * Sonner Toaster host — render once per route that needs toasts.
 *
 * TRADEOFF NOTE (bundle + functional audit):
 * This component was previously loaded via `dynamic(() => import("@/components/toaster-host"), { ssr: false })`
 * in `src/app/settings/page.tsx:47` and `src/app/billing/page.tsx:15` to save ~10kB initial bundle.
 * With `ssr: false` the Toaster mounts only after hydration; any `toast.*` call fired before mount is dropped.
 *
 * Current call sites are all user-click handlers — not mount effects:
 * - settings: export :146, delete :158,179,188,191
 * - billing: cancel :63,71, sync :92
 * By the time a user can click, hydration is done and the Toaster is mounted, so in practice no toasts are lost.
 * However a very fast click (<50-300ms after navigation, before the lazy chunk loads) could still drop a toast.
 *
 * For full reliability prefer a static import:
 *   `import { ToasterHost } from "@/components/toaster-host"`
 * which mounts synchronously and never drops early toasts. The dynamic import is a deliberate bundle-size vs.
 * reliability tradeoff; if reliability is prioritized, remove `dynamic` in the two pages and use the named export below.
 */
export function ToasterHost() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      toastOptions={{
        style: {
          background: "#141416",
          color: "#ffffff",
          border: "1px solid #1c1c20",
        },
      }}
    />
  );
}

export default ToasterHost;