import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindFirst = vi.fn();
const mockEndpointFindMany = vi.fn();
const mockDeliveryCreate = vi.fn();

const { mockGetSecret } = vi.hoisted(() => ({ mockGetSecret: vi.fn() }));

mockGetSecret.mockImplementation((key: string) => {
  const map: Record<string, string> = {
    NEXT_PUBLIC_APP_URL: "https://usegauge.com",
  };
  return map[key] || "";
});

vi.mock("@/lib/prisma", () => ({
  default: {
    integration: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    webhookEndpoint: {
      findMany: (...args: unknown[]) => mockEndpointFindMany(...args),
    },
    webhookDelivery: {
      create: (...args: unknown[]) => mockDeliveryCreate(...args),
    },
  },
}));

vi.mock("@/lib/secrets", () => ({
  getSecret: mockGetSecret,
}));

import {
  buildMeetingDigestBlocks,
  meetingHealthEmoji,
  postMeetingDigest,
} from "@/services/meeting-digest";
import { MEETING_READY_EVENT, emitMeetingReady } from "@/lib/meeting-events";

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockBotConfig = JSON.stringify({
  accessToken: "xoxb-test-token",
  teamId: "T001",
  teamName: "Test Team",
  botUserId: "U001",
  authedUserId: "U002",
  scope: "chat:write",
});

describe("meetingHealthEmoji", () => {
  it("is green at >= 70", () => {
    expect(meetingHealthEmoji(70)).toBe("🟢");
    expect(meetingHealthEmoji(95)).toBe("🟢");
  });

  it("is yellow at >= 40 and below 70", () => {
    expect(meetingHealthEmoji(40)).toBe("🟡");
    expect(meetingHealthEmoji(69.9)).toBe("🟡");
  });

  it("is red below 40", () => {
    expect(meetingHealthEmoji(39.9)).toBe("🔴");
    expect(meetingHealthEmoji(0)).toBe("🔴");
  });
});

describe("buildMeetingDigestBlocks", () => {
  it("builds header + summary + action items + health + footer", () => {
    const blocks = buildMeetingDigestBlocks({
      title: "Acme discovery",
      summary: "Agreed on pilot.",
      actionItems: ["Send proposal", "Follow up"],
      healthScore: 82,
    }) as Array<{ type: string; text?: { text: string }; elements?: Array<{ text: string }> }>;

    expect(blocks[0].type).toBe("header");
    expect(blocks[0].text?.text).toContain("Acme discovery");
    const joined = JSON.stringify(blocks);
    expect(joined).toContain("Agreed on pilot.");
    expect(joined).toContain("Send proposal");
    expect(joined).toContain("🟢");
    expect(joined).toContain("82%");
  });

  it("omits action-items section when empty", () => {
    const blocks = buildMeetingDigestBlocks({
      title: "No actions",
      actionItems: [],
    });
    expect(JSON.stringify(blocks)).not.toContain("Action Items");
  });

  it("omits health context when score is null/undefined", () => {
    const noScore = buildMeetingDigestBlocks({ title: "t" });
    expect(JSON.stringify(noScore)).not.toContain("Health score");

    const nullScore = buildMeetingDigestBlocks({ title: "t", healthScore: null });
    expect(JSON.stringify(nullScore)).not.toContain("Health score");
  });

  it("uses yellow/red thresholds matching slack.ts", () => {
    const yellow = JSON.stringify(
      buildMeetingDigestBlocks({ title: "t", healthScore: 55 }),
    );
    expect(yellow).toContain("🟡");

    const red = JSON.stringify(
      buildMeetingDigestBlocks({ title: "t", healthScore: 10 }),
    );
    expect(red).toContain("🔴");
  });
});

describe("postMeetingDigest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts via chat.postMessage with bot token", async () => {
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "slack",
      enabled: true,
      config: mockBotConfig,
    });
    let body: { channel?: string; blocks?: unknown[] } = {};
    mockFetch.mockImplementation(async (url: string, opts?: { body?: string }) => {
      if (String(url).includes("slack.com/api/chat.postMessage")) {
        body = JSON.parse(opts?.body || "{}");
        return { ok: true, json: async () => ({ ok: true }) };
      }
      return { ok: false, json: async () => ({}) };
    });

    const result = await postMeetingDigest({
      teamId: "team-1",
      title: "Acme discovery",
      summary: "Great call",
      actionItems: ["Send proposal"],
      healthScore: 82,
    });

    expect(result).toEqual({ delivered: true, channel: "#general" });
    expect(body.channel).toBe("#general");
    expect(JSON.stringify(body.blocks)).toContain("Acme discovery");
  });

  it("makes no network call without token or webhook URL", async () => {
    mockFindFirst.mockResolvedValue(null);
    // No SLACK_WEBHOOK_URL in the mocked getSecret map.
    const result = await postMeetingDigest({ teamId: "team-1", title: "T" });

    expect(result).toEqual({ delivered: false, channel: "" });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("emitMeetingReady", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enqueues only endpoints whose event filter matches", async () => {
    mockEndpointFindMany.mockResolvedValue([
      { id: "ep-match", teamId: "team-1", events: MEETING_READY_EVENT },
      { id: "ep-wild", teamId: "team-1", events: "*" },
      { id: "ep-other", teamId: "team-1", events: "call.analyzed" },
    ]);
    mockDeliveryCreate.mockResolvedValue({ id: "del-1" });

    const result = await emitMeetingReady({
      teamId: "team-1",
      userId: "user-1",
      title: "Acme discovery",
      summary: "Great call",
    });

    expect(result).toEqual({ enqueued: 2 });
    expect(mockDeliveryCreate).toHaveBeenCalledTimes(2);
    const endpointIds = mockDeliveryCreate.mock.calls.map(
      (c) => (c[0] as { data: { endpointId: string } }).data.endpointId,
    );
    expect(endpointIds).toContain("ep-match");
    expect(endpointIds).toContain("ep-wild");
    expect(endpointIds).not.toContain("ep-other");
    // Outbox rows stay pending for the cron dispatcher.
    for (const call of mockDeliveryCreate.mock.calls) {
      const data = (call[0] as { data: Record<string, unknown> }).data;
      expect(data.event).toBe(MEETING_READY_EVENT);
      expect(data.status).toBe("pending");
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns enqueued 0 and writes nothing when no endpoints match", async () => {
    mockEndpointFindMany.mockResolvedValue([
      { id: "ep-other", teamId: "team-1", events: "call.analyzed" },
    ]);

    const result = await emitMeetingReady({
      teamId: "team-1",
      userId: "user-1",
      title: "Acme discovery",
    });

    expect(result).toEqual({ enqueued: 0 });
    expect(mockDeliveryCreate).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns enqueued 0 when no endpoints exist", async () => {
    mockEndpointFindMany.mockResolvedValue([]);

    const result = await emitMeetingReady({
      teamId: "team-1",
      userId: "user-1",
      title: "Acme discovery",
    });

    expect(result).toEqual({ enqueued: 0 });
    expect(mockDeliveryCreate).not.toHaveBeenCalled();
  });
});
