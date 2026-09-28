import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Part5B (risk delivery) — verifies the risk passthrough across:
 *  1. buildMeetingDigestBlocks with/without risk (absent = byte-identical)
 *  2. GET /api/v1/meetings/[id] includes the scoreDeal risk object shape
 *  3. POST /api/slack/digest forwards an optional risk payload to blocks
 *
 * Mocks prisma + Slack transport. No live network.
 */

const mocks = vi.hoisted(() => ({
  integrationFindFirst: vi.fn(),
  userFindUnique: vi.fn(),
  callFindUnique: vi.fn(),
  resolveApiKey: vi.fn(),
  scopeAllowsMethod: vi.fn(),
  checkRateLimit: vi.fn(),
  auth: vi.fn(),
  getUserByClerkId: vi.fn(),
  canAccessCall: vi.fn(),
  getSecret: vi.fn(),
  scoreDeal: vi.fn(),
  blobDel: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    integration: {
      findFirst: (...args: unknown[]) => mocks.integrationFindFirst(...args),
    },
    user: { findUnique: (...args: unknown[]) => mocks.userFindUnique(...args) },
    call: { findUnique: (...args: unknown[]) => mocks.callFindUnique(...args) },
  },
}));
vi.mock("@/lib/secrets", () => ({ getSecret: mocks.getSecret }));
vi.mock("@/lib/resolve-api-key", () => ({
  resolveApiKey: mocks.resolveApiKey,
}));
vi.mock("@/lib/api-key", () => ({
  scopeAllowsMethod: mocks.scopeAllowsMethod,
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: mocks.getUserByClerkId,
}));
vi.mock("@/lib/call-access", () => ({
  canAccessCall: mocks.canAccessCall,
}));
vi.mock("@/lib/deal-risk", () => ({ scoreDeal: mocks.scoreDeal }));
vi.mock("@vercel/blob", () => ({ del: mocks.blobDel }));

import {
  buildMeetingDigestBlocks,
  postMeetingDigest,
} from "@/services/meeting-digest";
import { GET as MeetingsGET } from "@/app/api/v1/meetings/[id]/route";
import { POST as SlackDigestPOST } from "@/app/api/slack/digest/route";

const BASE = {
  title: "Acme discovery",
  summary: "Agreed on pilot.",
  actionItems: ["Send proposal"],
  healthScore: 82,
};

const RISK = {
  riskScore: 42,
  riskFlags: ["No economic buyer", "No budget", "No timeline"],
  nextQuestions: ["Who signs off on budget?", "When is the decision?"],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSecret.mockImplementation((key: string) =>
    key === "NEXT_PUBLIC_APP_URL" ? "https://usegauge.com" : "",
  );
  mocks.scopeAllowsMethod.mockReturnValue(true);
  mocks.checkRateLimit.mockResolvedValue({ success: true });
  global.fetch = mocks.fetch as unknown as typeof fetch;
});

describe("buildMeetingDigestBlocks risk delivery", () => {
  it("is byte-identical when risk is absent", () => {
    const without = buildMeetingDigestBlocks(BASE);
    const withUndefined = buildMeetingDigestBlocks({ ...BASE, risk: undefined });
    expect(JSON.stringify(withUndefined)).toBe(JSON.stringify(without));
    expect(JSON.stringify(without)).not.toContain("Risk score");
  });

  it("appends a Risk score /64 context line + top 2 flags + top question", () => {
    const blocks = buildMeetingDigestBlocks({ ...BASE, risk: RISK });
    const joined = JSON.stringify(blocks);
    expect(joined).toContain("Risk score");
    expect(joined).toContain("42/64");
    // Top 2 flags only.
    expect(joined).toContain("No economic buyer");
    expect(joined).toContain("No budget");
    expect(joined).not.toContain("No timeline");
    // Top question only.
    expect(joined).toContain("Who signs off on budget?");
    expect(joined).not.toContain("When is the decision?");
  });

  it("renders the score line even with empty flags/questions", () => {
    const joined = JSON.stringify(
      buildMeetingDigestBlocks({
        title: "t",
        risk: { riskScore: 7, riskFlags: [], nextQuestions: [] },
      }),
    );
    expect(joined).toContain("Risk score");
    expect(joined).toContain("7/64");
  });
});

describe("GET /api/v1/meetings/[id] risk shape", () => {
  it("includes the scoreDeal risk object built from transcript/summary", async () => {
    mocks.resolveApiKey.mockResolvedValue({
      kind: "ok",
      context: { userId: "u1", keyId: "k1", scope: "read", prefix: "cn_live_x" },
    });
    mocks.userFindUnique.mockResolvedValue({ id: "u1", teamId: "t1" });
    mocks.callFindUnique.mockResolvedValue({
      id: "m1",
      userId: "u1",
      teamId: "t1",
      title: "Sync",
      summary: "Great call",
      transcript: "we discussed budget and timeline",
      healthScore: 82,
    });
    mocks.scoreDeal.mockReturnValue({
      meddpicc: { metrics: true },
      bant: { budget: false },
      missingFields: ["budget"],
      riskFlags: ["No economic buyer"],
      riskScore: 42,
      nextQuestions: ["Who signs off on budget?"],
    });

    const res = await MeetingsGET(
      new Request("http://x/api/v1/meetings/m1", {
        headers: { authorization: "Bearer cn_live_x" },
      }),
      { params: Promise.resolve({ id: "m1" }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("m1");
    expect(body.title).toBe("Sync");
    expect(mocks.scoreDeal).toHaveBeenCalledWith(
      expect.objectContaining({
        transcript: "we discussed budget and timeline",
        summary: "Great call",
      }),
    );
    expect(body.risk).toMatchObject({
      missingFields: ["budget"],
      riskFlags: ["No economic buyer"],
      riskScore: 42,
      nextQuestions: ["Who signs off on budget?"],
    });
    expect(body.risk).toHaveProperty("meddpicc");
    expect(body.risk).toHaveProperty("bant");
  });

  it("omits risk when scoring throws (fallback keeps prior shape)", async () => {
    mocks.resolveApiKey.mockResolvedValue({
      kind: "ok",
      context: { userId: "u1", keyId: "k1", scope: "read", prefix: "cn_live_x" },
    });
    mocks.userFindUnique.mockResolvedValue({ id: "u1", teamId: "t1" });
    mocks.callFindUnique.mockResolvedValue({
      id: "m1",
      userId: "u1",
      teamId: "t1",
      title: "Sync",
      summary: "Great call",
      transcript: "hello",
      healthScore: 82,
    });
    mocks.scoreDeal.mockImplementation(() => {
      throw new Error("scorer outage");
    });

    const res = await MeetingsGET(
      new Request("http://x/api/v1/meetings/m1", {
        headers: { authorization: "Bearer cn_live_x" },
      }),
      { params: Promise.resolve({ id: "m1" }) },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: "m1",
      title: "Sync",
      summary: "Great call",
      healthScore: 82,
    });
  });
});

describe("POST /api/slack/digest risk passthrough", () => {
  const botConfig = JSON.stringify({
    accessToken: "xoxb-test-token",
    channel: "#general",
  });

  function mockSlackPost(capture: { body: unknown }) {
    mocks.integrationFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "t1",
      provider: "slack",
      enabled: true,
      config: botConfig,
    });
    mocks.fetch.mockImplementation(async (url: string, opts?: { body?: string }) => {
      if (String(url).includes("slack.com/api/chat.postMessage")) {
        capture.body = JSON.parse(opts?.body || "{}");
        return { ok: true, json: async () => ({ ok: true }) };
      }
      return { ok: false, json: async () => ({}) };
    });
  }

  function digestReq(payload: unknown): Request {
    return new Request("http://x/api/slack/digest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  beforeEach(() => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.getUserByClerkId.mockResolvedValue({
      id: "u1",
      teamId: "t1",
      teamRole: "MEMBER",
    });
    mocks.canAccessCall.mockReturnValue(true);
  });

  it("forwards risk to the posted Slack blocks", async () => {
    const capture: { body: unknown } = { body: null };
    mockSlackPost(capture);

    const res = await SlackDigestPOST(
      digestReq({
        title: "Acme discovery",
        summary: "Great call",
        risk: {
          riskScore: 42,
          riskFlags: ["No economic buyer"],
          nextQuestions: ["Who signs off on budget?"],
        },
      }) as never,
    );

    expect(res.status).toBe(200);
    const posted = capture.body as { blocks: unknown[] };
    const joined = JSON.stringify(posted.blocks);
    expect(joined).toContain("Risk score");
    expect(joined).toContain("42/64");
    expect(joined).toContain("No economic buyer");
    expect(joined).toContain("Who signs off on budget?");
  });

  it("posts unchanged blocks when risk is absent", async () => {
    const capture: { body: unknown } = { body: null };
    mockSlackPost(capture);

    const res = await SlackDigestPOST(
      digestReq({ title: "Acme discovery", summary: "Great call" }) as never,
    );

    expect(res.status).toBe(200);
    const posted = capture.body as { blocks: unknown[] };
    expect(JSON.stringify(posted.blocks)).not.toContain("Risk score");
  });

  it("postMeetingDigest renders risk blocks end-to-end via token post", async () => {
    mocks.integrationFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "t1",
      provider: "slack",
      enabled: true,
      config: botConfig,
    });
    let postedBlocks: unknown[] = [];
    mocks.fetch.mockImplementation(async (url: string, opts?: { body?: string }) => {
      if (String(url).includes("slack.com/api/chat.postMessage")) {
        postedBlocks = (JSON.parse(opts?.body || "{}") as { blocks: unknown[] })
          .blocks;
        return { ok: true, json: async () => ({ ok: true }) };
      }
      return { ok: false, json: async () => ({}) };
    });

    const result = await postMeetingDigest({
      teamId: "t1",
      title: "Acme",
      risk: RISK,
    });

    expect(result).toEqual({ delivered: true, channel: "#general" });
    expect(JSON.stringify(postedBlocks)).toContain("42/64");
  });
});
