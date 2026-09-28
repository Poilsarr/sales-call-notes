import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/get-user";
import { canAccessCall } from "@/lib/call-access";
import { postMeetingDigest } from "@/services/meeting-digest";

/**
 * POST /api/slack/digest — Clerk-gated per-meeting digest.
 *
 * Body: { title, summary?, actionItems?[], healthScore?, callId? }
 * When callId is present the caller's access to that call is verified
 * with the same canAccessCall IDOR guard as POST /api/slack.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, summary, actionItems, healthScore, callId, risk } = body ?? {};

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    const user = await getUserByClerkId(userId);
    const teamId = user.teamId || "";
    if (!teamId) {
      return NextResponse.json({ error: "team workspace required" }, { status: 400 });
    }

    if (callId) {
      const call = await prisma.call.findUnique({ where: { id: callId } });
      if (!call) {
        return NextResponse.json({ error: "Call not found" }, { status: 404 });
      }
      if (
        !canAccessCall(
          { id: user.id, teamId: user.teamId, teamRole: user.teamRole },
          call,
        )
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const items = Array.isArray(actionItems)
      ? actionItems.filter((t): t is string => typeof t === "string" && t.length > 0)
      : undefined;

    const score =
      typeof healthScore === "number" && Number.isFinite(healthScore)
        ? healthScore
        : undefined;

    // Optional risk passthrough → forwarded to postMeetingDigest (omitted
    // entirely when absent or malformed, preserving prior behavior).
    let digestRisk:
      | { riskScore: number; riskFlags: string[]; nextQuestions: string[] }
      | undefined;
    if (risk !== null && typeof risk === "object") {
      const candidate = risk as {
        riskScore?: unknown;
        riskFlags?: unknown;
        nextQuestions?: unknown;
      };
      if (
        typeof candidate.riskScore === "number" &&
        Number.isFinite(candidate.riskScore)
      ) {
        const onlyStrings = (v: unknown): string[] =>
          Array.isArray(v)
            ? v.filter(
                (t): t is string => typeof t === "string" && t.length > 0,
              )
            : [];
        digestRisk = {
          riskScore: candidate.riskScore,
          riskFlags: onlyStrings(candidate.riskFlags),
          nextQuestions: onlyStrings(candidate.nextQuestions),
        };
      }
    }

    const result = await postMeetingDigest({
      teamId,
      title,
      summary: typeof summary === "string" ? summary : undefined,
      actionItems: items,
      healthScore: score,
      callId: typeof callId === "string" ? callId : undefined,
      ...(digestRisk ? { risk: digestRisk } : {}),
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Slack digest failed" }, { status: 500 });
  }
}
