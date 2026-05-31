import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimitMiddleware } from "./middleware-rate-limit";

const isPublicApi = createRouteMatcher(["/api/analyze"]);
const isProtectedRoute = createRouteMatcher(["/api/(.*)", "/dashboard(.*)", "/app(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
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

  // Dynamic CSP: allow-list core services
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.clerk.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: *.clerk.com *.paddle.com images.higgs.ai",
    "media-src 'self' *.cloudfront.net",
    "connect-src 'self' *.clerk.com *.openai.com *.groq.com *.paddle.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
