import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const isPublicApi = createRouteMatcher(["/api/analyze", "/api/transcribe", "/api/transcribe/live", "/api/summarize"]);
const isProtectedRoute = createRouteMatcher(["/api/(.*)", "/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isProtectedRoute(req) && !isPublicApi(req)) {
    const { userId } = auth();
    if (!userId) {
      if (req.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";
    const { success } = await checkRateLimit(ip);
    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
