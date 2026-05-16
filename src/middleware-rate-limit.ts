import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function rateLimitMiddleware(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";
  const { success } = await checkRateLimit(ip);

  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  return NextResponse.next();
}