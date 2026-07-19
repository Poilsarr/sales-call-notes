import prisma from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";

/**
 * Plan-based call retention.
 *
 * Free users keep `uploadLimit` (rolling, most-recent) calls visible.
 * When they upload beyond the cap, the OLDEST calls beyond the limit are
 * soft-archived (archived=true) — they remain in the DB (restorable on
 * upgrade) but are hidden from the calls list / history. Pro & Business have
 * uploadLimit="unlimited" so nothing is ever archived.
 *
 * The "margin" is implicit: we always keep the most-recent `uploadLimit`
 * calls and archive only what's older, so the newest uploads are never at
 * risk of being swept in the same request that created them.
 */
export async function enforceCallRetention(userId: string, plan: PlanTier): Promise<number> {
  const limit = PLANS[plan]?.uploadLimit;
  if (limit === undefined || limit === "unlimited") return 0;

  // Count non-archived calls owned by this user.
  const visibleCount = await prisma.call.count({
    where: { userId, archived: false },
  });

  if (visibleCount <= limit) return 0;

  // Archive the oldest overflow (keep the most recent `limit`).
  const overflow = visibleCount - limit;
  const toArchive = await prisma.call.findMany({
    where: { userId, archived: false },
    orderBy: { createdAt: "asc" },
    take: overflow,
    select: { id: true },
  });

  if (toArchive.length === 0) return 0;

  const ids = toArchive.map((c) => c.id);
  await prisma.call.updateMany({
    where: { id: { in: ids } },
    data: { archived: true },
  });

  return toArchive.length;
}

/**
 * Returns true if the user is at/over their visible-call limit and may not
 * upload another without archiving. Used to gate the upload UI + API.
 */
export async function isAtCallLimit(userId: string, plan: PlanTier): Promise<boolean> {
  const limit = PLANS[plan]?.uploadLimit;
  if (limit === undefined || limit === "unlimited") return false;

  const visibleCount = await prisma.call.count({
    where: { userId, archived: false },
  });
  return visibleCount >= limit;
}
