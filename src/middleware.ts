import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimitMiddleware } from "./middleware-rate-limit";
import * as Sentry from "@sentry/nextjs";

const isPublicApi = createRouteMatcher([
  "/api/webhooks/(.*)",
  "/api/paddle/webhook",
  "/api/health",
  "/api/v1/(.*)", // public API: auth via API key in Authorization header
]);
const isProtectedRoute = createRouteMatcher(["/api/(.*)", "/dashboard(.*)", "/app(.*)", "/team(.*)", "/integrations(.*)", "/settings(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  try {
    const rateLimitResponse = await rateLimitMiddleware(req);
    if (rateLimitResponse) return rateLimitResponse;

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

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
