import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const isProtectedRoute = createRouteMatcher(["/api/(.*)", "/dashboard(.*)", "/app(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isProtectedRoute(req)) {
    const { userId } = auth();
    if (!userId) {
      if (req.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const ip = req.ip ?? req.headers.get("x-real-ip") ?? "anonymous";
    const identifier = userId ? `user:${userId}` : `ip:${ip}`;
    const { success } = await checkRateLimit(identifier);
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
