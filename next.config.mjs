import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // @vercel/blob uses undici@6 which has #private fields — webpack in Next 14 can't parse it.
  // Keep it externalized so it's required at runtime on the server side.
  serverExternalPackages: ['@vercel/blob'],
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
