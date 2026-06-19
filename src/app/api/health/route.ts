import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health
 *
 * Level 6.3 — uptime monitoring endpoint.
 * Returns 200 when:
 *   - the server is reachable
 *   - Prisma can ping the database
 *
 * Returns 503 if the DB is unreachable so monitoring can alert.
 * Always returns a JSON body with diagnostic details.
 *
 * Designed to be hit every 30-60s by Better Stack / UptimeRobot.
 * No auth required (it would otherwise break the check).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const START_TIME = Date.now();

export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  let dbError: string | null = null;
  let dbLatencyMs: number | null = null;

  try {
    const t0 = Date.now();
    // Cheapest possible DB round-trip: SELECT 1.
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const ok = dbOk;
  const body = {
    ok,
    service: "callnote-pro",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
    db: {
      ok: dbOk,
      latencyMs: dbLatencyMs,
      error: dbError,
    },
    checkedAt: new Date().toISOString(),
    responseTimeMs: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json",
    },
  });
}