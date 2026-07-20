"use client";

import Nav from "@/components/nav";
import Link from "next/link";
import SiteFooter from "@/components/site-footer";

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 pt-36 pb-20">
        <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-medium tracking-tight mb-2">Blog</h1>
        <p className="text-gray-400 text-[13px] mb-10">Notes for SDRs, RevOps, and sales engineers.</p>

        <div className="space-y-10">
          <article className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Coming soon</p>
            <h2 className="text-[18px] font-semibold text-gray-900">
              The first post is on its way
            </h2>
            <p className="text-[14px] text-gray-600 leading-relaxed">
              We&apos;re working on practical guides for transcribing sales calls,
              extracting competitive intelligence, and writing CRM-ready notes in
              seconds. Subscribe by email or check back here in a couple of weeks.
            </p>
          </article>

          <article className="space-y-2">
            <h2 className="text-[15px] font-semibold text-gray-900">In the meantime</h2>
            <ul className="text-[14px] text-gray-600 space-y-1.5">
              <li>
                <Link className="text-gray-900 underline" href="/features">Tour the product</Link>
              </li>
              <li>
                <Link className="text-gray-900 underline" href="/api-docs">Read the API docs</Link>
              </li>
              <li>
                <Link className="text-gray-900 underline" href="/demo">Try the live demo</Link>
              </li>
              <li>
                <a className="text-gray-900 underline" href="mailto:hello@usegauge.com">
                  Get in touch
                </a>
              </li>
            </ul>
          </article>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
