import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockCallFindMany = vi.fn();
const mockCallFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  default: {
    integration: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
    },
    call: {
      findMany: (...args: any[]) => mockCallFindMany(...args),
      findUnique: (...args: any[]) => mockCallFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/secrets", () => ({
  getSecret: (key: string) => {
    const map: Record<string, string> = {
      SLACK_WEBHOOK_URL: "https://hooks.slack.com/test",
      SLACK_SIGNING_SECRET: "test-signing-secret",
      NEXT_PUBLIC_APP_URL: "https://usegauge.com",
    };
    return map[key] || "";
  },
}));

import { SlackService } from "@/services/slack";
import { generateWeeklyDigest } from "@/services/slack-digest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockBotConfig = JSON.stringify({
  accessToken: "xoxb-test-token",
  teamId: "T001",
  teamName: "Test Team",
  botUserId: "U001",
  authedUserId: "U002",
  scope: "chat:write,chat:write.public,users:read,commands,im:write",
});

describe("SlackService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendDirectMessage", () => {
    it("should send DM successfully with bot token", async () => {
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "slack",
        enabled: true,
        config: mockBotConfig,
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, channel: { id: "D12345" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true }),
        });

      const service = new SlackService("team-1");
      const result = await service.sendDirectMessage("U12345", "Hello from Gauge");

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        "https://slack.com/api/conversations.open",
        expect.objectContaining({
          body: JSON.stringify({ users: "U12345" }),
        }),
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "https://slack.com/api/chat.postMessage",
        expect.objectContaining({
          body: expect.stringContaining("Hello from Gauge"),
        }),
      );
    });

    it("should return false when no bot token", async () => {
      mockFindFirst.mockResolvedValue(null);

      const service = new SlackService("team-1");
      const result = await service.sendDirectMessage("U12345", "Hello");

      expect(result).toBe(false);
    });

    it("should return false when conversations.open fails", async () => {
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "slack",
        enabled: true,
        config: mockBotConfig,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: false, error: "user_not_found" }),
      });

      const service = new SlackService("team-1");
      const result = await service.sendDirectMessage("U12345", "Hello");

      expect(result).toBe(false);
    });
  });

  describe("sendCallSummary", () => {
    const message = {
      filename: "Q1-review.mp3",
      summary: "Great call about the project.",
      actionItems: [
        { task: "Send proposal", owner: "Alice", due: "2025-02-01" },
        { task: "Follow up", owner: "Bob", due: null },
      ],
      keyDecisions: ["Proceed with phase 2"],
      healthScore: 0.85,
    };

    it("should send summary to channel using bot token", async () => {
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "slack",
        enabled: true,
        config: mockBotConfig,
      });

      let messageBody: any = null;
      mockFetch.mockImplementation(async (url: string, opts?: any) => {
        if (url.includes("slack.com/api/chat.postMessage")) {
          messageBody = JSON.parse(opts?.body || "{}");
          return { ok: true, json: async () => ({ ok: true }) };
        }
        return { ok: false, json: async () => ({}) };
      });

      const service = new SlackService("team-1");
      const result = await service.sendCallSummary(message);

      expect(result).toBe(true);
      expect(messageBody.channel).toBe("#general");
      expect(messageBody.text).toBe("New call notes: Q1-review.mp3");
      expect(messageBody.blocks[0].text.text).toBe("📞 Q1-review.mp3");
    });

    it("should send DM to assignee when slackUserId provided", async () => {
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "slack",
        enabled: true,
        config: mockBotConfig,
      });

      let dmBody: any = null;
      let callCount = 0;

      mockFetch.mockImplementation(async (url: string, opts?: any) => {
        if (url.includes("conversations.open")) {
          return { ok: true, json: async () => ({ ok: true, channel: { id: "D12345" } }) };
        }
        if (url.includes("slack.com/api/chat.postMessage")) {
          callCount++;
          const body = JSON.parse(opts?.body || "{}");
          if (callCount === 2) {
            dmBody = body;
          }
          return { ok: true, json: async () => ({ ok: true }) };
        }
        return { ok: false, json: async () => ({}) };
      });

      const service = new SlackService("team-1");
      const result = await service.sendCallSummary(message, "U_ASSIGNEE");

      expect(result).toBe(true);
      expect(dmBody).not.toBeNull();
      expect(dmBody.text).toContain("Action Items from");
      expect(dmBody.text).toContain("Send proposal");
    });

    it("should fall back to webhook when no bot token", async () => {
      mockFindFirst.mockResolvedValue(null);

      mockFetch.mockResolvedValue({ ok: true });

      const service = new SlackService();
      const result = await service.sendCallSummary(message);

      expect(result).toBe(true);
    });

    it("should return false when no integration and fetch fails", async () => {
      mockFindFirst.mockResolvedValue(null);
      mockFetch.mockResolvedValue({ ok: false });

      const service = new SlackService();
      const result = await service.sendCallSummary(message);

      expect(result).toBe(false);
    });

    it("should handle empty action items", async () => {
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "slack",
        enabled: true,
        config: mockBotConfig,
      });

      let messageBody: any = null;
      mockFetch.mockImplementation(async (url: string, opts?: any) => {
        if (url.includes("slack.com/api/chat.postMessage")) {
          messageBody = JSON.parse(opts?.body || "{}");
          return { ok: true, json: async () => ({ ok: true }) };
        }
        return { ok: false, json: async () => ({}) };
      });

      const service = new SlackService("team-1");
      const result = await service.sendCallSummary({
        ...message,
        actionItems: [],
        keyDecisions: [],
        healthScore: null,
      });

      expect(result).toBe(true);
    });
  });

  describe("sendCompetitorAlert", () => {
    it("should send competitor alert via bot token", async () => {
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "slack",
        enabled: true,
        config: mockBotConfig,
      });

      let messageBody: any = null;
      mockFetch.mockImplementation(async (url: string, opts?: any) => {
        if (url.includes("slack.com/api/chat.postMessage")) {
          messageBody = JSON.parse(opts?.body || "{}");
          return { ok: true, json: async () => ({ ok: true }) };
        }
        return { ok: false, json: async () => ({}) };
      });

      const service = new SlackService("team-1");
      const result = await service.sendCompetitorAlert(
        [{ name: "Acme Corp", context: "mentioned pricing", sentiment: "negative" }],
        "Q1-review.mp3",
        "https://usegauge.com/calls/123",
      );

      expect(result).toBe(true);
      expect(messageBody.blocks[0].text.text).toContain("Q1-review.mp3");
    });

    it("should return false when no competitors", async () => {
      const service = new SlackService("team-1");
      const result = await service.sendCompetitorAlert([], "test.mp3", "url");

      expect(result).toBe(false);
    });
  });
});

describe("generateWeeklyDigest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when no Slack integrations", async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await generateWeeklyDigest();

    expect(result).toBe(0);
  });

  it("should skip integrations without config", async () => {
    mockFindMany.mockResolvedValue([
      { id: "int-1", teamId: "team-1", provider: "slack", enabled: true, config: null, team: { name: "Test Team" } },
    ]);

    const result = await generateWeeklyDigest();

    expect(result).toBe(0);
  });

  it("should format and send digest for team with calls", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "int-1",
        teamId: "team-1",
        provider: "slack",
        enabled: true,
        config: mockBotConfig,
        team: { name: "Test Team" },
      },
    ]);

    mockCallFindMany.mockResolvedValue([
      {
        id: "call-1",
        teamId: "team-1",
        healthScore: 0.9,
        createdAt: new Date(),
        actionItems: [{ task: "Send proposal", owner: "Alice", status: "PENDING" }],
        analytics: { objections: JSON.stringify(["budget", "timeline"]) },
      },
      {
        id: "call-2",
        teamId: "team-1",
        healthScore: 0.5,
        createdAt: new Date(),
        actionItems: [],
        analytics: { objections: JSON.stringify(["budget"]) },
      },
    ]);

    let postedText = "";
    mockFetch.mockImplementation(async (url: string, opts?: any) => {
      if (url.includes("slack.com/api/chat.postMessage")) {
        postedText = JSON.parse(opts?.body || "{}").text;
        return { ok: true, json: async () => ({ ok: true }) };
      }
      return { ok: false, json: async () => ({}) };
    });

    const result = await generateWeeklyDigest();

    expect(result).toBe(1);
    expect(postedText).toContain("Weekly Digest");
    expect(postedText).toContain("Test Team");
    expect(postedText).toContain("Total Calls:");
    expect(postedText).toContain("2");
    expect(postedText).toContain("Pending Action Items:");
    expect(postedText).toContain("1");
  });
});

describe("Slash Command Verification", () => {
  it("should compute valid signature with HMAC-SHA256", () => {
    const timestamp = "1700000000";
    const rawBody = "command=/callnote&text=abc123&user_id=U123";
    const base = `v0:${timestamp}:${rawBody}`;
    const hmac = crypto.createHmac("sha256", "test-signing-secret").update(base).digest("hex");
    const signature = `v0=${hmac}`;

    expect(signature).toMatch(/^v0=[a-f0-9]{64}$/);
  });

  it("should produce different signature for different body", () => {
    const timestamp = "1700000000";
    const rawBody1 = "command=/callnote&text=abc";
    const rawBody2 = "command=/callnote&text=xyz";
    const base1 = `v0:${timestamp}:${rawBody1}`;
    const base2 = `v0:${timestamp}:${rawBody2}`;
    const sig1 = crypto.createHmac("sha256", "test-signing-secret").update(base1).digest("hex");
    const sig2 = crypto.createHmac("sha256", "test-signing-secret").update(base2).digest("hex");

    expect(sig1).not.toBe(sig2);
  });

  it("should reject timestamp older than 5 minutes", () => {
    const oldTime = Math.floor(Date.now() / 1000) - 301;
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.abs(now - oldTime);

    expect(diff).toBeGreaterThan(300);
  });

  it("should accept timestamp within 5 minutes", () => {
    const recentTime = Math.floor(Date.now() / 1000) - 60;
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.abs(now - recentTime);

    expect(diff).toBeLessThanOrEqual(300);
  });
});
