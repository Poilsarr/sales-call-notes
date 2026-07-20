import Link from "next/link";
import { Crosshair, ArrowRight } from "lucide-react";
import DemoCarousel from "@/components/demo-carousel";
import GaugeLogo from "@/components/gauge-logo";

/**
 * /demo — server component shell.
 *
 * The interactive carousel (useState for active call + pulse interval)
 * is a client island at <DemoCarousel />. The rest of the page is
 * static, including the header, hero copy, and footer.
 */
export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white">
      {/* HEADER */}
      <header className="border-b border-white/5 sticky top-0 bg-[#0a0a0b]/90 backdrop-blur z-10">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <GaugeLogo size={26} dark />
            <span className="text-[14px] font-semibold tracking-tight">Gauge</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/40 hidden sm:inline">
              Live demo · Sample data
            </span>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[12px] rounded-full pl-4 pr-1.5 py-1.5"
            >
              <span>Start free</span>
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <ArrowRight size={11} className="text-[#F26522]" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-16 sm:pt-20 pb-8">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#F26522] mb-4">
          <Crosshair size={12} /> Competitive Intelligence, live
        </div>
        <h1 className="text-[clamp(1.75rem,5vw,3.4rem)] font-medium leading-[1.1] tracking-[-0.02em] max-w-3xl mb-4">
          See every competitor mention — the second it happens.
        </h1>
        <p className="text-white/50 text-[14px] max-w-2xl mb-2">
          Five sample calls. Real transcript moments where Gong, Chorus, Otter, and Fireflies
          entered the deal. The same engine runs on every paid plan.
        </p>
        <p className="text-white/30 text-[12px]">
          Click a call on the left. Watch the alert panel update.
        </p>
      </section>

      <DemoCarousel />

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-6 text-center text-[11px] text-white/30">
        Sample data for product demo. Not from real customers. Gauge · {new Date().getFullYear()}
      </footer>
    </main>
  );
}