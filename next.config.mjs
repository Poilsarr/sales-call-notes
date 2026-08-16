import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // @vercel/blob uses undici@6 which has #private fields — webpack in Next 14 can't parse it.
  // Keep it externalized so it's required at runtime on the server side.
  serverExternalPackages: ['@vercel/blob'],
  // The AI analysis routes read prompt templates (src/lib/prompts/*.md) from
  // disk at runtime via fs.promises.readFile. Those .md files are NOT webpack
  // imports, so they never make it into the serverless function bundle by
  // default — on Vercel the read throws ENOENT and every analysis silently
  // falls back to the all-zero scorecard. Trace them into the function
  // bundles so the runtime read resolves on prod.
  outputFileTracingIncludes: {
    '/api/analyze': ['./src/lib/prompts/**/*.md'],
    '/api/summarize': ['./src/lib/prompts/**/*.md'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  tunnelRoute: '/monitoring',
  telemetry: false,
  silent: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
