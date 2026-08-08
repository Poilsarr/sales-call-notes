import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Rate-limit gate. The marketing site (public HTML routes) is short-
 * circuited one level up in `middleware.ts`; this function is only
 * invoked for `/api/*` and protected routes. We still defend in depth
 * by also short-circuiting any non-`/api/*` request here.
 */
export async function rateLimitMiddleware(req: NextRequest) {
  const url = req.nextUrl.pathname;
  const isApi = url.startsWith('/api/');

  if (!isApi) {
    return null;
  }

  // Next 15 removed the NextRequest.ip getter — read the proxied headers instead.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous";

  // ponytail: /api/transcribe/live is the SSE publish sink for the live
  // transcription feature. The browser fires a POST on every speech
  // recognition event (interim + final), which would blow the 100/min
  // 'api' bucket instantly. It's already Clerk-authenticated, so skip
  // the generic rate limit here.
  if (url.startsWith('/api/transcribe/live')) {
    return null;
  }

  let type = 'default';
  if (url.startsWith('/api/analyze')) {
    type = 'analyze';
  } else if (url.startsWith('/api/')) {
    type = 'api';
  }

  const { success } = await checkRateLimit(ip, type);

  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  return null;
}
