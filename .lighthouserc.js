module.exports = {
  ci: {
    collect: {
      startServerCommand: "npx next start -p 3200",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 60000,
      url: [
        "http://localhost:3200/",
        "http://localhost:3200/api-docs",
        "http://localhost:3200/security",
        "http://localhost:3200/privacy",
        "http://localhost:3200/vs/gong",
      ],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --headless=new",
      },
    },
    assert: {
      assertions: {
        // Thresholds grounded in real local runs (2026-08-14, next 15.5.23,
        // evidence in .lighthouseci/lhr-*.json): perf 96-100, a11y 91-96,
        // best-practices 74, seo 92, LCP 745-808ms, CLS 0.000-0.113, TBT 0,
        // byte-weight 784-807KB (5 URLs, desktop preset). Headroom on every
        // hard threshold; warn for everything that is environment-sensitive
        // (clerk-js CDN, /features canvas).
        "categories:performance": ["error", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.85 }],
        "categories:best-practices": [
          "error",
          {
            minScore: 0.7,
            // 74 locally; the failing audits are Clerk environment
            // artifacts (third-party-cookies, errors-in-console,
            // inspector-issues) — see LIGHTHOUSE-CI-PRD R6/T1.
          },
        ],
        "categories:seo": [
          "warn",
          {
            minScore: 0.9,
            // 92 locally. Hard-gating SEO is blocked by a tracked product
            // bug: @clerk/nextjs 5.7.6 ClerkProvider calls headers() ->
            // whole app renders dynamic -> root loading.tsx streams a
            // fallback -> Next inserts all metadata at the TOP OF BODY ->
            // Lighthouse's head-meta gatherer finds no description. Tracked
            // in DEVELOPMENT_FRONTIER.md "Tracked items" (meta-in-body, P1).
          },
        ],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.15 }],
        "total-blocking-time": ["warn", { maxNumericValue: 200 }],
        // Static rendering (CLERK-STATIC arc, 2026-08-15) changed Link
        // prefetch behavior: static routes download the full RSC payload +
        // page chunks of in-viewport links, where dynamic routes fetched only
        // the shell. Post-migration local proof: 795-922KB (5 URLs, desktop
        // preset; /api-docs 922KB, /vs/gong 905KB). Re-grounded from 900KB
        // (pre-migration 784-807KB) to 1MB with ~78KB headroom over the worst
        // measured URL; keep it as a hard gate, not a warn.
        "total-byte-weight": ["error", { maxNumericValue: 1_000_000 }],
        "unused-javascript": ["warn", { maxNumericValue: 50_000 }],
        "uses-responsive-images": ["warn"],
        "offscreen-images": ["warn"],
        "unused-css-rules": ["warn"],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
