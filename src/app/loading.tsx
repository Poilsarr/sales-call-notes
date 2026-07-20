import GaugeLogo from "@/components/gauge-logo";

export default function Loading() {
  // Branded loading state — was the default Next.js "Loading..." text
  // with a generic spinner (caught on the 2026-06-30 video walkthrough,
  // frames 26 + 35). Now: a doppel-outer card with the brand mark,
  // a small brand-tinted pulsing dot, and a single line of monospace
  // text. Reuses the same visual vocabulary as the rest of the app
  // (orange #F26522, mono font, doppel depth) so it never feels
  // like a generic scaffold.
  return (
    <main className="min-h-screen bg-[#EFEFEF] flex items-center justify-center p-6">
      <div className="doppel-outer">
        <div className="doppel-inner px-6 sm:px-8 py-7 sm:py-8 flex items-center gap-4 bg-white">
          <div className="relative shrink-0">
            <GaugeLogo className="animate-pulse" size={40} />
          </div>
          <div>
            <p className="text-[14px] font-medium text-gray-900 leading-tight">
              Gauge
            </p>
            <p className="text-[11px] font-mono text-gray-500 mt-0.5">
              Loading your workspace...
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
