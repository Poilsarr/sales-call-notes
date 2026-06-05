import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function rateLimitMiddleware(req: NextRequest) {
  const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";
  const url = req.nextUrl.pathname;

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
