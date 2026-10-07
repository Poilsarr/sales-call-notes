import { Crosshair, ShieldCheck, Download } from "lucide-react";

/**
 * ObjectionTrio — three rows from the comparison table, up close.
 *
 * Zero new claims: every heading/body string below is reused verbatim
 * from the ROWS table in src/components/differentiators.tsx
 * (No-bot capture / Data used to train models / CRM push).
 *
 * Calm cards: one icon per card, no coded minis.
 *
 * Server component — no JS shipped.
 */

export function ObjectionTrio() {
  return (
    <section
      aria-label="Common objections"
      data-track-section="objections"
      className="bg-white border-t border-gray-200"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-3">
            Objections, answered
          </p>
          <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
            The three questions every team asks
          </h2>
          <p className="text-gray-500 text-[14px]">
            Straight from the comparison table — no fine print.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="doppel-outer h-full">
            <div className="doppel-inner p-6 h-full flex flex-col">
              <Crosshair size={20} className="text-[#F26522] mb-4" aria-hidden />
              <h3 className="text-[15px] font-semibold tracking-tight mb-1.5">
                No-bot capture
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Upload, record, or Meet — no bot joins
              </p>
            </div>
          </div>

          <div className="doppel-outer h-full">
            <div className="doppel-inner p-6 h-full flex flex-col">
              <ShieldCheck
                size={20}
                className="text-[#F26522] mb-4"
                aria-hidden
              />
              <h3 className="text-[15px] font-semibold tracking-tight mb-1.5">
                Data used to train models
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Never
              </p>
            </div>
          </div>

          <div className="doppel-outer h-full">
            <div className="doppel-inner p-6 h-full flex flex-col">
              <Download size={20} className="text-[#F26522] mb-4" aria-hidden />
              <h3 className="text-[15px] font-semibold tracking-tight mb-1.5">
                CRM push
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                One click on Pro ($9)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ObjectionTrio;
