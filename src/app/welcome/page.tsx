import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Welcome to Gauge",
  robots: { index: false, follow: false },
};

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#F26522]/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-[#F26522]" />
          </div>
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em] mb-3">
            You&apos;re all set!
          </h1>
          <p className="text-gray-500 text-[14px] mb-8">
            Thanks for subscribing to Gauge. Your plan is now active and your account has been
            upgraded. We&apos;ve emailed your receipt.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300"
            >
              <span className="flex flex-col overflow-hidden h-[20px]">
                <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                  Go to dashboard
                </span>
                <span className="leading-[20px]">Go to dashboard</span>
              </span>
              <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                <ArrowRight size={14} className="text-[#F26522]" />
              </span>
            </Link>
            <Link
              href="/billing"
              className="px-5 py-2.5 rounded-full text-[13px] font-medium border border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition"
            >
              Manage billing
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
