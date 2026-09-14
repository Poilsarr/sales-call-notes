/**
 * Proof strip (FRONTPAGE-PITCH-PLAN §2): borrowed trust in viewport 1–2.
 * Honest numbers only — no invented logos, names, or stats.
 * Source: SocialProof stats (500+ calls, 12 testers) + Alex R. quote verbatim.
 */
export default function ProofStrip() {
  return (
    <section
      aria-label="Early traction"
      className="bg-white border-b border-gray-200"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-4">
        <p className="mx-auto max-w-3xl text-balance text-center text-[12.5px] leading-relaxed text-gray-500">
          <span className="font-medium text-gray-700">12 beta teams</span>
          <span aria-hidden className="mx-2 text-gray-300">
            ·
          </span>
          <span className="font-medium text-gray-700">500+ calls</span>
          <span aria-hidden className="mx-2 text-gray-300">
            ·
          </span>
          <span className="italic">
            &ldquo;Gauge caught a Gong mention I missed in a 40-minute discovery call.&rdquo;
          </span>{" "}
          <span className="text-gray-400">— Alex R., SDR, beta tester</span>
        </p>
        <p className="mt-1.5 text-center text-[12px] leading-relaxed text-gray-400">
          <span className="font-medium text-gray-500">500+ calls</span>
          <span aria-hidden className="mx-2 text-gray-300">
            ·
          </span>
          <span className="font-medium text-gray-500">60s avg processing</span>
          <span aria-hidden className="mx-2 text-gray-300">
            ·
          </span>
          <span className="font-medium text-gray-500">99.2% uptime</span>
        </p>
      </div>
    </section>
  );
}
