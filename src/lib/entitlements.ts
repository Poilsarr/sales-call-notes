import prisma from "@/lib/prisma";
import { PlanTier, FeatureId, PLANS, getPlan, hasFeature } from "./plans";
import { getUserByClerkId } from "./get-user";

export type EntitlementResult = {
  allowed: boolean;
  plan: PlanTier;
  reason?: string;
  upgradeUrl?: string;
};

export async function checkFeatureAccess(
  userId: string,
  feature: FeatureId,
  metadata?: { currentUsage?: number }
): Promise<EntitlementResult> {
  const user = await getUserByClerkId(userId);
  const planTier: PlanTier = ((user?.plan?.toLowerCase() as PlanTier) || "free") as PlanTier;
  const plan = getPlan(planTier);

  const allowed = hasFeature(plan, feature);
  if (!allowed) {
    return {
      allowed: false,
      plan: planTier,
      reason: `Upgrade to ${getRequiredPlanTier(feature)} to access this feature`,
      upgradeUrl: `/pricing?feature=${feature}`,
    };
  }

  if (feature === "upload_audio" && plan.uploadLimit !== "unlimited" && metadata?.currentUsage !== undefined) {
    if (metadata.currentUsage >= plan.uploadLimit) {
      return {
        allowed: false,
        plan: planTier,
        reason: `Monthly upload limit reached (${plan.uploadLimit}). Upgrade for unlimited uploads.`,
        upgradeUrl: `/pricing`,
      };
    }
  }

  return { allowed: true, plan: planTier };
}

function getRequiredPlanTier(feature: FeatureId): string {
  for (const [tier, config] of Object.entries(PLANS)) {
    const val = config.features[feature];
    if (val === true) {
      if (tier === "free") return "Free";
      if (tier === "pro") return "Pro";
      if (tier === "business") return "Business";
      if (tier === "enterprise") return "Enterprise";
    }
  }
  return "a paid plan";
}

export async function getUsageCount(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return prisma.call.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  });
}

export async function getUserPlan(userId: string): Promise<{ tier: PlanTier; usage: number; limit: number | "unlimited" }> {
  const user = await getUserByClerkId(userId);
  const tier: PlanTier = ((user?.plan?.toLowerCase() as PlanTier) || "free") as PlanTier;
  const plan = getPlan(tier);
  const usage = await getUsageCount(user.id);
  return { tier, usage, limit: plan.uploadLimit === "unlimited" ? "unlimited" : plan.uploadLimit as number };
}
