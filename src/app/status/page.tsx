import Link from "next/link";
import Nav from "@/components/nav";
import StatusClient from "@/components/status-client";

export const metadata = {
  title: "System Status",
  description: "Live operational status of Gauge services.",
};

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white">
      <div className="bg-[#0a0a0b]">
        <Nav />
      </div>

      <section className="pt-20 pb-24 px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#F26522] mb-4">
              <span className="w-2 h-2 rounded-full bg-[#F26522] animate-pulse" />
              Live status
            </div>
            <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-3">
              System status
            </h1>
            <p className="text-white/50 text-[14px] max-w-md mx-auto">
              Real-time operational state for Gauge.
              Refreshes automatically every 30 seconds.
            </p>
          </div>

          <StatusClient />

          <div className="mt-16 pt-8 border-t border-white/10 text-center">
            <p className="text-[12px] text-white/40 mb-2">
              Need to report an issue or check past incidents?
            </p>
            <Link
              href="mailto:support@usegauge.com"
              className="text-[13px] text-[#F26522] hover:text-[#ff8a4a] underline-offset-4 hover:underline"
            >
              support@usegauge.com
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}