import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimitMiddleware } from "./middleware-rate-limit";
import * as Sentry from "@sentry/nextjs";

const isPublicApi = createRouteMatcher([
  "/api/webhooks/hubspot",
  "/api/webhooks/salesforce",
  "/api/paddle/webhook",
  "/api/cron/(.*)",
  "/api/health",
  "/api/pricing-preview",
  "/api/v1/calls",
]);
const isProtectedRoute = createRouteMatcher(["/api/(.*)", "/dashboard(.*)", "/app(.*)", "/team(.*)", "/integrations(.*)", "/settings(.*)", "/billing(.*)", "/live(.*)"]);

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
      const { userId } = await auth();
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
      "script-src 'self' 'unsafe-inline'" +
        (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "") +
        " *.clerk.com *.clerk.accounts.dev https://challenges.cloudflare.com https://*.protect.clerk.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: *.clerk.com *.clerk.accounts.dev https://img.clerk.com *.paddle.com *.hubspot.com *.salesforce.com",
      "media-src 'self' *.cloudfront.net",
      "connect-src 'self' *.clerk.com *.clerk.accounts.dev https://*.protect.clerk.com *.openai.com *.groq.com *.paddle.com *.vercel.com vercel.com vitals.vercel-insights.com *.hubapi.com *.hubspot.com *.salesforce.com *.microsoftonline.com *.microsoft.com *.deepgram.com wss://*.deepgram.com",
      "frame-ancestors 'none'",
      "frame-src *.clerk.com *.clerk.accounts.dev https://challenges.cloudflare.com https://*.protect.clerk.com",
      "worker-src 'self' blob:",
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
// in the matcher explicitly. /api/webhooks/hubspot, /api/webhooks/salesforce,
// /api/paddle/webhook, /api/health, and /api/v1/* are public APIs that don't
// need Clerk auth or rate-limit middleware. The USER webhook management
// endpoint (/api/webhooks) must NOT be excluded here — without middleware,
// auth() throws in production builds and every POST 500s.
export const config = {
  matcher: [
    "/api/((?!webhooks/hubspot|webhooks/salesforce|paddle|health|partners|pricing-preview).*)",
    "/dashboard/:path*",
    "/app/:path*",
    "/team/:path*",
    "/integrations/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/live/:path*",
    "/share/:path*",
    "/sign-in",
    "/sign-in/:path*",
    "/sign-up",
    "/sign-up/:path*",
  ],
};
