import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSecret } from "@/lib/secrets";
import { sendWeeklyDigestEmail } from "@/services/email";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = getSecret("CRON_SECRET");

  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: { hasOnboarded: true },
      select: { id: true, email: true, name: true },
    });

    let delivered = 0;
    let skipped = 0;

    for (const user of users) {
      if (!user.email) {
        skipped++;
        continue;
      }

      const calls = await prisma.call.findMany({
        where: { userId: user.id, createdAt: { gte: weekAgo } },
        include: {
          actionItems: { where: { status: "PENDING" } },
        },
      });

      if (calls.length === 0) {
        skipped++;
        continue;
      }

      const healthScores = calls
        .map((c) => c.healthScore)
        .filter((s): s is number => s !== null);
      const avgHealth =
        healthScores.length > 0
          ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length
          : null;
      const pendingItems = calls.reduce((sum, c) => sum + c.actionItems.length, 0);

      const ok = await sendWeeklyDigestEmail(
        user.email,
        { totalCalls: calls.length, pendingItems, avgHealth },
        user.name
      );
      if (ok) delivered++;
      else skipped++;
    }

    return NextResponse.json({ delivered, skipped });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Email digest failed" },
      { status: 500 }
    );
  }
}
