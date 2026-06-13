import prisma from "@/lib/prisma";

type SlackConfig = {
  accessToken: string;
  teamId: string;
  teamName: string;
  botUserId: string;
  authedUserId: string;
  scope: string;
};

type DigestTeam = {
  teamId: string;
  teamName: string;
  token: string;
  totalCalls: number;
  avgHealthScore: number | null;
  topObjections: string[];
  pendingActionItems: number;
};

export async function generateWeeklyDigest(): Promise<number> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const integrations = await prisma.integration.findMany({
    where: { provider: "slack", enabled: true },
    include: { team: true },
  });

  const digestTeams: DigestTeam[] = [];

  for (const integration of integrations) {
    if (!integration.config) continue;

    let config: SlackConfig;
    try {
      config = JSON.parse(integration.config);
    } catch {
      continue;
    }

    const calls = await prisma.call.findMany({
      where: {
        teamId: integration.teamId,
        createdAt: { gte: weekAgo },
      },
      include: {
        actionItems: { where: { status: "PENDING" } },
        analytics: true,
      },
    });

    if (calls.length === 0) continue;

    const healthScores = calls.map(c => c.healthScore).filter((s): s is number => s !== null);
    const avgHealth = healthScores.length > 0
      ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length
      : null;

    const objectionsSeen = new Set<string>();
    for (const call of calls) {
      if (call.analytics?.objections) {
        try {
          const parsed = typeof call.analytics.objections === "string"
            ? JSON.parse(call.analytics.objections)
            : call.analytics.objections;
          if (Array.isArray(parsed)) {
            parsed.forEach((o: string) => objectionsSeen.add(o));
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    const pendingItems = calls.reduce((sum, c) => sum + c.actionItems.length, 0);

    digestTeams.push({
      teamId: integration.teamId,
      teamName: integration.team?.name || "Unknown Team",
      token: config.accessToken,
      totalCalls: calls.length,
      avgHealthScore: avgHealth,
      topObjections: Array.from(objectionsSeen).slice(0, 5),
      pendingActionItems: pendingItems,
    });
  }

  let delivered = 0;

  for (const team of digestTeams) {
    const healthLine = team.avgHealthScore !== null
      ? `*Average Health Score:* ${Math.round(team.avgHealthScore * 100)}%\n`
      : "";

    const objectionsLine = team.topObjections.length > 0
      ? `*Top Objections:* ${team.topObjections.join(", ")}\n`
      : "";

    const text = `📊 *CallNote Pro Weekly Digest*
*Team:* ${team.teamName}
*Period:* Past 7 days

*Total Calls:* ${team.totalCalls}
${healthLine}${objectionsLine}*Pending Action Items:* ${team.pendingActionItems}`;

    try {
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${team.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: "#general",
          text,
          unfurl_links: false,
        }),
      });
      const data = await res.json();
      if (data.ok) delivered++;
    } catch {
      // skip failed delivery
    }
  }

  return delivered;
}
