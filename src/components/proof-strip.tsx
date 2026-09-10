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
        <p className="text-center text-[12.5px] leading-relaxed text-gray-500">
          <span className="font-medium text-gray-700">12 beta teams</span>
          <span aria-hidden className="mx-2 text-gray-300">
            ·
          </span>
          <span className="font-medium text-gray-700">500+ calls</span>
          <span aria-hidden className="mx-2 text-gray-300">
            ·
          </span>
          <span className="italic">
            &ldquo;caught a Gong mention I missed&rdquo;
          </span>{" "}
          <span className="text-gray-400">— Alex R., SDR</span>
        </p>
      </div>
    </section>
  );
}
