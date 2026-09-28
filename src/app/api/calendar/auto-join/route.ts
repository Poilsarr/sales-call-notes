import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { requireRole } from "@/lib/rbac";
import { decryptConfig, encryptConfig } from "@/lib/integrations/config-crypto";

const PROVIDER = "google_calendar";

/**
 * Reads the autoJoin flag from a stored google_calendar config payload.
 * Never throws: missing row, undecryptable config, or unparsable JSON all
 * mean "auto-join off" (false) rather than a 500.
 */
function readAutoJoin(storedConfig: string | null): boolean {
  if (!storedConfig) return false;
  const raw = decryptConfig(storedConfig);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { autoJoin?: unknown };
    return parsed.autoJoin === true;
  } catch {
    return false;
  }
}

function parseStoredConfig(storedConfig: string | null): Record<string, unknown> {
  if (!storedConfig) return {};
  const raw = decryptConfig(storedConfig);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(userId);
  if (!user.teamId) {
    return NextResponse.json({ autoJoin: false, code: "NO_TEAM" }, { status: 400 });
  }

  const { allowed } = await requireRole(user.clerkId, user.teamId, "ADMIN");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.integration.findFirst({
    where: { teamId: user.teamId, provider: PROVIDER },
  });

  return NextResponse.json({ autoJoin: readAutoJoin(existing?.config ?? null) });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(userId);
  if (!user.teamId) {
    return NextResponse.json({ error: "No team", code: "NO_TEAM" }, { status: 400 });
  }

  const { allowed } = await requireRole(user.clerkId, user.teamId, "ADMIN");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { autoJoin?: unknown };
  try {
    body = (await req.json()) as { autoJoin?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.autoJoin !== "boolean") {
    return NextResponse.json({ error: "autoJoin must be a boolean" }, { status: 400 });
  }

  const existing = await prisma.integration.findFirst({
    where: { teamId: user.teamId, provider: PROVIDER },
  });

  const merged = { ...parseStoredConfig(existing?.config ?? null), autoJoin: body.autoJoin };
  const encrypted = encryptConfig(JSON.stringify(merged));

  if (existing) {
    await prisma.integration.update({
      where: { id: existing.id },
      data: { config: encrypted },
    });
  } else {
    await prisma.integration.create({
      data: {
        teamId: user.teamId,
        provider: PROVIDER,
        config: encrypted,
        enabled: false,
      },
    });
  }

  return NextResponse.json({ autoJoin: body.autoJoin });
}
