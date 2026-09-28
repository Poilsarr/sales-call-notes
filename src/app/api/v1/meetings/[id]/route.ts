import { NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/resolve-api-key";
import { scopeAllowsMethod } from "@/lib/api-key";
import { checkRateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { purgeCallData } from "@/lib/retention";
import { del as blobDel } from "@vercel/blob";

/**
 * GET /api/v1/meetings/[id] — single meeting for extension/panel deep-links.
 * DELETE /api/v1/meetings/[id] — full purge of a meeting + children + blob.
 *
 * Dual-auth EXACTLY like /api/v1/calls: resolveApiKey first (Bearer
 * cn_live_/cn_test_), then Clerk session fallback. DELETE requires the
 * read_write scope; GET allows read or read_write.
 *
 * Ownership: 404 when the meeting is missing, 403 when it belongs to a
 * foreign user/team (call.userId/team must match the requester).
 */

type AuthContext = { dbUserId: string; teamId: string | null };

async function resolveAuth(
  req: Request,
  method: "GET" | "DELETE",
): Promise<{ ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }> {
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

  return { ok: true, ctx: { dbUserId, teamId } };
}

/**
 * Part5B risk delivery — Part5A provides scoreDeal from @/lib/deal-risk.
 * Dynamic import with fallback: when the module is absent (or scoring
 * throws), the `risk` key is omitted and the pre-existing shape is kept
 * byte-identical.
 */
async function maybeScoreDealRisk(call: {
  transcript?: string | null;
  summary?: string | null;
}): Promise<unknown | undefined> {
  try {
    // @ts-ignore — Part5A provides @/lib/deal-risk; resolves once it lands.
    const mod = await import("@/lib/deal-risk");
    const scoreDeal = (
      mod as {
        scoreDeal?: (input: { transcript: string; summary: string }) => unknown;
      }
    ).scoreDeal;
    if (typeof scoreDeal !== "function") return undefined;
    const risk = await scoreDeal({
      transcript: call.transcript ?? "",
      summary: call.summary ?? "",
    });
    return risk ?? undefined;
  } catch {
    return undefined;
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authed = await resolveAuth(req, "GET");
  if (!authed.ok) return authed.response;
  const { dbUserId, teamId } = authed.ctx;

  const { id } = await params;
  const call = await prisma.call.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      teamId: true,
      title: true,
      summary: true,
      transcript: true,
      healthScore: true,
    },
  });

  if (!call) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  if (call.userId !== dbUserId && !(teamId && call.teamId === teamId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const risk = await maybeScoreDealRisk(call);
  const body: Record<string, unknown> = {
    id: call.id,
    title: call.title,
    summary: call.summary,
    healthScore: call.healthScore,
  };
  if (risk !== undefined) body.risk = risk;
  return NextResponse.json(body);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authed = await resolveAuth(req, "DELETE");
  if (!authed.ok) return authed.response;
  const { dbUserId, teamId } = authed.ctx;

  const { id } = await params;
  const call = await prisma.call.findUnique({
    where: { id },
    select: { id: true, userId: true, teamId: true },
  });

  if (!call) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  if (call.userId !== dbUserId && !(teamId && call.teamId === teamId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await purgeCallData({ callId: id, deleteAudio: blobDel });

  return NextResponse.json({ deleted: true, id });
}
