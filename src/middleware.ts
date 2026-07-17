import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimitMiddleware } from "./middleware-rate-limit";
import * as Sentry from "@sentry/nextjs";

const isPublicApi = createRouteMatcher([
  "/api/webhooks/(.*)",
  "/api/paddle/webhook",
  "/api/cron/(.*)",
  "/api/health",
  "/api/v1/competitive-intelligence",
  "/api/v1/calls",
  "/api/v1/transcribe",
]);
const isProtectedRoute = createRouteMatcher(["/api/(.*)", "/dashboard(.*)", "/app(.*)", "/team(.*)", "/integrations(.*)", "/settings(.*)", "/billing(.*)"]);

// Public marketing routes never see the Redis rate-limit hop. The previous
// version ran `checkRateLimit` on every HTML request, which (a) added a
// synchronous network roundtrip to TTFB and (b) could return a 429 JSON
// body for the marketing site when the Upstash bucket was tight —
// killing the Vercel Speed Index / LCP score.
const isMarketingRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/features",
  "/demo",
  "/extension",
  "/security",
  "/privacy",
  "/terms",
  "/refund",
  "/api-docs",
  "/api-docs/(.*)",
  "/blog",
  "/blog/(.*)",
  "/status",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  try {
    if (!isMarketingRoute(req)) {
      const rateLimitResponse = await rateLimitMiddleware(req);
      if (rateLimitResponse) return rateLimitResponse;
    }

    if (isProtectedRoute(req) && !isPublicApi(req)) {
      const { userId } = auth();
      if (!userId) {
        if (req.nextUrl.pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/sign-in", req.url));
      }
    }

    const response = NextResponse.next();

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.clerk.com *.clerk.accounts.dev",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: *.clerk.com *.clerk.accounts.dev *.paddle.com *.hubspot.com *.salesforce.com",
      "media-src 'self' *.cloudfront.net",
      "connect-src 'self' *.clerk.com *.clerk.accounts.dev *.openai.com *.groq.com *.paddle.com *.vercel.com vitals.vercel-insights.com *.hubapi.com *.hubspot.com *.salesforce.com *.microsoftonline.com *.microsoft.com",
      "frame-ancestors 'none'",
      "frame-src *.clerk.com *.clerk.accounts.dev",
      "object-src 'none'",
      "manifest-src 'self'",
      "form-action 'self'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    return response;
  } catch (err) {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(err, {
        tags: { source: "middleware" },
        extra: { pathname: req.nextUrl.pathname },
      });
    }
    return NextResponse.json(
      { error: "Internal middleware error" },
      { status: 500 },
    );
  }
});

// The matcher is the biggest single perf lever for the marketing site.
// Previously this was the default Next.js catch-all pattern, which
// caused clerkMiddleware to run on EVERY request — including the static
// marketing HTML pages. Clerk middleware does a session-cookie read + a
// crypto verification on every request; on a cold Vercel function (first
// request after idle) that adds 1-4 seconds of TTFB. The Vercel Speed
// Insights mobile RES dropped to 30 because the mobile HTML request was
// the cold-start path. By restricting the matcher to protected routes
// only, the marketing HTML never touches middleware: it goes straight
// from the Vercel CDN edge to the static HTML. Static HTML + edge cache
// = sub-50ms TTFB on every device.
//
// /sign-in and /sign-up are Clerk-managed pages and MUST run through
// middleware so Clerk can detect the "after sign-in" redirect. They're
// in the matcher explicitly. /api/webhooks, /api/paddle/webhook,
// /api/health, and /api/v1/* are public APIs that don't need Clerk
// auth or rate-limit middleware.
export const config = {
  matcher: [
    "/api/((?!webhooks|paddle|health).*)",
    "/dashboard/:path*",
    "/app/:path*",
    "/team/:path*",
    "/integrations/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/sign-in",
    "/sign-in/:path*",
    "/sign-up",
    "/sign-up/:path*",
  ],
};
