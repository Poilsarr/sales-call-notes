import Nav from "@/components/nav";
import Link from "next/link";
import { Shield, Eye, Lock, UserCheck, ArrowRight, Zap, FileText } from "lucide-react";

export const metadata = {
  title: "No Bot, No Auto-Join — Gauge Privacy First",
  description: "Otter got sued for recording without consent. We never auto-join your meetings. Upload-first, consent-first, GDPR-first.",
};

export default function NoBotPage() {
  return (
    <>
      <Nav />
      <main id="main" className="min-h-screen bg-white text-zinc-900">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="eyebrow inline-flex items-center gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[11px] font-semibold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              Privacy First
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            Otter got sued for recording without consent.
            <br />
            <span className="text-[#F26522]">We won&apos;t join your meeting.</span>
          </h1>

          <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10">
            Every other meeting recorder auto-joins your call as a bot.
            We don&apos;t. You upload the recording when you&apos;re ready.
            Consent is yours to give, not ours to assume.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F26522] hover:bg-[#e05a1a] text-white text-sm font-semibold transition"
            >
              Start free — no bot needed
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-semibold transition"
            >
              See pricing
            </Link>
          </div>
        </div>

        {/* How it works comparison */}
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">How we&apos;re different</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Them */}
            <div className="doppel-outer">
              <div className="doppel-inner p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Eye className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold">How Otter / Fireflies / Fathom work</h3>
                </div>
                <ul className="space-y-3 text-sm text-zinc-600">
                  <li className="flex gap-3">
                    <span className="text-red-400 shrink-0">✗</span>
                    <span>A bot joins your Zoom / Meet / Teams call uninvited</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-red-400 shrink-0">✗</span>
                    <span>Everyone on the call sees &quot;Otter is recording&quot;</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-red-400 shrink-0">✗</span>
                    <span>Bot captures audio from the moment it arrives</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-red-400 shrink-0">✗</span>
                    <span>Recording happens whether or not everyone consented</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-red-400 shrink-0">✗</span>
                    <span>Your audio is processed on their servers, stored indefinitely</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Us */}
            <div className="doppel-outer ring-2 ring-[#F26522]/30">
              <div className="doppel-inner p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-[#F26522]/10">
                    <Shield className="w-5 h-5 text-[#F26522]" />
                  </div>
                  <h3 className="text-xl font-semibold">How Gauge works</h3>
                </div>
                <ul className="space-y-3 text-sm text-zinc-700">
                  <li className="flex gap-3">
                    <span className="text-green-500 shrink-0">✓</span>
                    <span><strong>No bot. No auto-join. Ever.</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 shrink-0">✓</span>
                    <span>You record the meeting yourself (or export from Zoom)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 shrink-0">✓</span>
                    <span>You upload the file when <em>you</em> decide</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 shrink-0">✓</span>
                    <span>Consent is explicit — no surprise &quot;bot is here&quot; banner</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 shrink-0">✓</span>
                    <span>GDPR + HIPAA-friendly by default. Delete in 30 days.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Three pillars */}
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="doppel-outer">
              <div className="doppel-inner p-6">
                <Lock className="w-8 h-8 text-[#F26522] mb-4" />
                <h3 className="font-semibold mb-2">Consent-first design</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  No meeting participant is ever surprised by a recording.
                  You control when the recording starts, who sees it, and when it&apos;s deleted.
                </p>
              </div>
            </div>

            <div className="doppel-outer">
              <div className="doppel-inner p-6">
                <Shield className="w-8 h-8 text-[#F26522] mb-4" />
                <h3 className="font-semibold mb-2">GDPR + HIPAA default</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  EU data residency available. HIPAA-friendly architecture.
                  We don&apos;t train on your data. We don&apos;t sell it. We delete it.
                </p>
              </div>
            </div>

            <div className="doppel-outer">
              <div className="doppel-inner p-6">
                <UserCheck className="w-8 h-8 text-[#F26522] mb-4" />
                <h3 className="font-semibold mb-2">Upload, not auto-capture</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Drag and drop an MP3, WAV, or M4A. Or pipe from the Chrome extension.
                  You choose what to analyze. We never touch a file you didn&apos;t send.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* The lawsuit context */}
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="doppel-outer">
            <div className="doppel-inner p-8">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-zinc-400" />
                <span className="text-sm text-zinc-500 uppercase tracking-wider">The context</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">
                In 2025, Otter.ai was sued for recording meetings without consent.
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed mb-4">
                The lawsuit alleged that Otter&apos;s auto-join feature recorded conversations
                where not all participants had consented — a violation of two-party
                consent laws in several US states. The bot joined silently, recorded
                silently, and the host had to actively notice and remove it.
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed">
                We built Gauge on the opposite principle: <strong className="text-zinc-900">
                the user controls the recording, the upload, and the deletion.
                We never auto-join. We never assume consent.</strong> That&apos;s not
                just safer — it&apos;s better UX.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F26522]/10 text-[#F26522] text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            $9/mo flat — no per-seat games
          </div>
          <h2 className="text-3xl font-bold mb-4">Try it without a bot in your next meeting</h2>
          <p className="text-zinc-500 mb-8">
            Upload a recording you already have. Get a full AI analysis in under 60 seconds.
            No bot. No auto-join. No surprise.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#F26522] hover:bg-[#e05a1a] text-white text-base font-semibold transition"
          >
            Get started free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </>
  );
}