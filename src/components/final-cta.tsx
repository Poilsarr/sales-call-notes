import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Closing CTA banner — the final conversion touchpoint on the home page.
 * Sits between the pricing teaser and the footer.
 *
 * Server component — no JS shipped.
 */
export default function FinalCta() {
  return (
    <section className="bg-white pb-16 sm:pb-20 lg:pb-28">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="doppel-outer">
          <div className="doppel-inner bg-gradient-to-br from-[#0a0a0b] via-[#0a0a0b] to-[#1a0f08] p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-60 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(242,101,34,0.18), transparent 60%)",
              }}
            />
            <div className="relative z-10">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#F26522] mb-5 font-mono">
                Start today
              </p>
              <h2 className="text-[clamp(1.75rem,4vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.02em] text-white mb-4 max-w-2xl mx-auto">
                Stop writing call notes. Start closing more deals.
              </h2>
              <p className="text-white/50 text-[14px] sm:text-[15px] max-w-xl mx-auto mb-8 leading-relaxed">
                Free forever for solo SDRs. $9/mo when your team grows. No
                credit traps, no per-minute AI tax, no bots in your meetings.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[14px] font-medium rounded-full pl-6 pr-2 py-2.5 transition-colors duration-300"
                >
                  <span>Start free</span>
                  <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                    <ArrowRight size={15} className="text-[#F26522]" />
                  </span>
                </Link>
                <Link
                  href="/pricing"
                  className="text-[14px] text-white/70 hover:text-white font-medium underline underline-offset-4 px-4 py-2.5"
                >
                  See full pricing →
                </Link>
              </div>
              <p className="text-white/30 text-[12px] mt-6">
                No credit card. Cancel anytime. Annual billing available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
