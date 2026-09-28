import { NextRequest, NextResponse } from "next/server";
import { del as blobDel } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { getSecret } from "@/lib/secrets";
import { isExpired, purgeCallData } from "@/lib/retention";

export const maxDuration = 60;

const DEFAULT_AUDIO_DAYS = 90;
const DEFAULT_TRANSCRIPT_DAYS = 365;
const PAGE_SIZE = 50;

type PolicyRow = {
  teamId: string;
  audioDays: number;
  transcriptDays: number;
  deleteAudioOnly: boolean;
};

async function loadPolicies(): Promise<Map<string, PolicyRow>> {
  try {
    const rows = await prisma.retentionPolicy.findMany();
    return new Map(rows.map((r) => [r.teamId, r]));
  } catch {
    // Table missing pre-migration (P2021) — fall back to defaults.
    return new Map();
  }
}

/**
 * POST /api/cron/retention — per-team retention sweep (CRON_SECRET guard).
 *
 * Loads the RetentionPolicy per team (defaults 90 audio / 365 transcript
 * days when absent), scans the 50 oldest calls, and for each:
 *   - past transcriptDays (and !deleteAudioOnly) → full purge via purgeCallData
 *   - else past audioDays with an audioUrl → delete blob + null audioUrl
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = getSecret("CRON_SECRET");

  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const policies = await loadPolicies();

  const candidates = await prisma.call.findMany({
    orderBy: { createdAt: "asc" },
    take: PAGE_SIZE,
    select: { id: true, teamId: true, audioUrl: true, createdAt: true },
  });

  let audioPurged = 0;
  let callsPurged = 0;

  for (const candidate of candidates) {
    const policy = candidate.teamId ? policies.get(candidate.teamId) : undefined;
    const audioDays = policy?.audioDays ?? DEFAULT_AUDIO_DAYS;
    const transcriptDays = policy?.transcriptDays ?? DEFAULT_TRANSCRIPT_DAYS;
    const deleteAudioOnly = policy?.deleteAudioOnly ?? false;

    if (isExpired(candidate.createdAt, transcriptDays) && !deleteAudioOnly) {
      await purgeCallData({ callId: candidate.id, deleteAudio: blobDel });
      callsPurged++;
      continue;
    }

    if (candidate.audioUrl && isExpired(candidate.createdAt, audioDays)) {
      try {
        await blobDel(candidate.audioUrl);
      } catch (e: unknown) {
        console.warn(
          `Blob delete failed (non-fatal): ${e instanceof Error ? e.message : String(e)}`,
        );
      }
      await prisma.call.update({
        where: { id: candidate.id },
        data: { audioUrl: null },
      });
      audioPurged++;
    }
  }

  return NextResponse.json({ audioPurged, callsPurged });
}
