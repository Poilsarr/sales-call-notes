module.exports = {
  ci: {
    collect: {
      startServerCommand: "npx next start -p 3200",
      startServerReadyPattern: "ready started server",
      url: [
        "http://localhost:3200/",
        "http://localhost:3200/pricing",
        "http://localhost:3200/features",
        "http://localhost:3200/sign-in",
        "http://localhost:3200/api-docs",
      ],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --headless=new",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.95 }],
        "categories:performance": ["error", { minScore: 0.9 }],
        "total-byte-weight": ["error", { maxNumericValue: 350_000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
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
