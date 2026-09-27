import { NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/resolve-api-key";
import { scopeAllowsMethod } from "@/lib/api-key";
import { checkRateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { createBot, getRecallPlatform, isJoinableMeetingUrl } from "@/services/recall";

/**
 * POST /api/v1/bots — dispatch a meeting bot (Recall) for a joinable URL.
 * GET  /api/v1/bots — list the caller's own bot sessions (take 20).
 *
 * Dual-auth EXACTLY like /api/v1/calls: resolveApiKey first (Bearer
 * cn_live_/cn_test_), then Clerk session fallback. POST requires the
 * read_write scope; GET allows read or read_write.
 */

type AuthContext = { dbUserId: string; teamId: string };

async function resolveAuth(req: Request, method: "GET" | "POST"): Promise<
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: NextResponse }
> {
  // 1. Try API key first (preserves Clerk session fallback).
  const apiKeyResult = await resolveApiKey(req.headers.get("authorization"));

  if (apiKeyResult && apiKeyResult.kind === "rate_limited") {
    const retryAfterSec = Math.max(1, Math.ceil((apiKeyResult.resetAt - Date.now()) / 1000));
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
      ),
    };
  }

  const apiKey = apiKeyResult?.kind === "ok" ? apiKeyResult.context : null;
  let userId: string | null = null;

  if (apiKey) {
    if (!scopeAllowsMethod(apiKey.scope, method)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Insufficient scope" }, { status: 403 }),
      };
    }
    userId = apiKey.userId;
  } else {
    // Fall back to Clerk session — same logic as /api/v1/calls GET.
    const { auth } = await import("@clerk/nextjs/server");
    const session = await auth();
    userId = session.userId;
    if (!userId) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    // Per-user bucket for the session path (60/min) — the API-key path
    // already enforces its own per-key limit upstream. Fail-open on outage.
    const { success } = await checkRateLimit(`v1session:${userId}`, "v1session");
    if (!success) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 }),
      };
    }
  }

  // 2. Look up db userId from clerkId (api key already gave us db id).
  let dbUserId: string;
  let teamId: string | null = null;
  if (apiKey) {
    dbUserId = apiKey.userId;
    try {
      const row = await prisma.user.findUnique({
        where: { id: dbUserId },
        select: { id: true, teamId: true },
      });
      teamId = row?.teamId ?? null;
    } catch {
      teamId = null;
    }
  } else {
    const { getUserByClerkId } = await import("@/lib/get-user");
    const u = await getUserByClerkId(userId!);
    dbUserId = u.id;
    teamId = (u as { teamId?: string | null }).teamId ?? null;
  }

  return { ok: true, ctx: { dbUserId, teamId: teamId ?? dbUserId } };
}

function botTableMissing(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  if (code === "P2021") return true; // table does not exist
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /botSession|BotSession/i.test(msg);
}

export async function POST(req: Request) {
  const authed = await resolveAuth(req, "POST");
  if (!authed.ok) return authed.response;
  const { dbUserId, teamId } = authed.ctx;

  const delegate = (prisma as unknown as Record<string, unknown>).botSession as
    | {
        create: (args: unknown) => Promise<Record<string, unknown>>;
        update: (args: unknown) => Promise<Record<string, unknown>>;
      }
    | undefined;
  if (!delegate) {
    return NextResponse.json({ error: "Bot table missing", code: "BOT_TABLE_MISSING" }, { status: 501 });
  }

  let body: { meetingUrl?: unknown; title?: unknown };
  try {
    body = (await req.json()) as { meetingUrl?: unknown; title?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const meetingUrl = typeof body.meetingUrl === "string" ? body.meetingUrl.trim() : "";
  const title = typeof body.title === "string" && body.title.trim().length > 0 ? body.title.trim().slice(0, 200) : undefined;

  if (!meetingUrl || !isJoinableMeetingUrl(meetingUrl)) {
    return NextResponse.json(
      { error: "meetingUrl must be a joinable Zoom, Google Meet, or Teams URL", code: "INVALID_MEETING_URL" },
      { status: 400 },
    );
  }

  const platform = getRecallPlatform(meetingUrl);

  let session: { id: string };
  try {
    session = (await delegate.create({
      data: {
        teamId,
        userId: dbUserId,
        meetingUrl,
        platform,
        status: "pending",
        ...(title ? { title } : {}),
      },
    })) as { id: string };
  } catch (err) {
    if (botTableMissing(err)) {
      return NextResponse.json({ error: "Bot table missing", code: "BOT_TABLE_MISSING" }, { status: 501 });
    }
    return NextResponse.json({ error: "Failed to create bot session" }, { status: 500 });
  }

  try {
    const result = await createBot({ meetingUrl, title });
    const next = (await delegate.update({
      where: { id: session.id },
      data: {
        status: result.status,
        ...(result.recallBotId ? { recallBotId: result.recallBotId } : {}),
      },
    })) as { status?: string };
    const status = typeof next.status === "string" ? next.status : result.status;
    return NextResponse.json({ id: session.id, status, mode: result.mode, meetingUrl, platform });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bot dispatch failed";
    try {
      await delegate.update({
        where: { id: session.id },
        data: { status: "failed", error: message.slice(0, 500) },
      });
    } catch {
      // best-effort status update; still report the dispatch failure below
    }
    return NextResponse.json(
      { id: session.id, status: "failed", mode: "recall", meetingUrl, platform, error: "BOT_DISPATCH_FAILED" },
      { status: 502 },
    );
  }
}

export async function GET(req: Request) {
  const authed = await resolveAuth(req, "GET");
  if (!authed.ok) return authed.response;
  const { dbUserId } = authed.ctx;

  const delegate = (prisma as unknown as Record<string, unknown>).botSession as
    | {
        findMany: (args: unknown) => Promise<Array<Record<string, unknown>>>;
      }
    | undefined;
  if (!delegate) {
    return NextResponse.json({ error: "Bot table missing", code: "BOT_TABLE_MISSING" }, { status: 501 });
  }

  try {
    const sessions = await delegate.findMany({
      where: { userId: dbUserId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        meetingUrl: true,
        platform: true,
        status: true,
        recallBotId: true,
        title: true,
        transcriptUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ sessions });
  } catch (err) {
    if (botTableMissing(err)) {
      return NextResponse.json({ error: "Bot table missing", code: "BOT_TABLE_MISSING" }, { status: 501 });
    }
    return NextResponse.json({ error: "Failed to list bot sessions" }, { status: 500 });
  }
}
