import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  resolveApiKey: vi.fn(),
  getUserByClerkId: vi.fn(),
  checkRateLimit: vi.fn(),
  userFindUnique: vi.fn(),
  botCreate: vi.fn(),
  botUpdate: vi.fn(),
  botFindMany: vi.fn(),
  botFindFirst: vi.fn(),
  emitMeetingReady: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/resolve-api-key", () => ({ resolveApiKey: mocks.resolveApiKey }));
vi.mock("@/lib/get-user", () => ({ getUserByClerkId: mocks.getUserByClerkId }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findUnique: mocks.userFindUnique },
    botSession: {
      create: mocks.botCreate,
      update: mocks.botUpdate,
      findMany: mocks.botFindMany,
      findFirst: mocks.botFindFirst,
    },
  },
}));
vi.mock("@/lib/meeting-events", () => ({
  emitMeetingReady: mocks.emitMeetingReady,
}));

vi.stubGlobal("fetch", mocks.fetch);

import { POST as BotsPOST, GET as BotsGET } from "@/app/api/v1/bots/route";
import { POST as RecallPOST } from "@/app/api/webhooks/recall/route";

const ZOOM = "https://zoom.us/j/123456789?pwd=abc";
const MEET = "https://meet.google.com/abc-defg-hij";
const TEAMS = "https://teams.microsoft.com/l/meetup-join/19%3Aabc";

function botsPost(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://x/api/v1/bots", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function recallPost(raw: string, signature: string | null): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (signature !== null) headers["x-recall-signature"] = signature;
  return new Request("http://x/api/webhooks/recall", {
    method: "POST",
    headers,
    body: raw,
  });
}

function sign(raw: string, secret: string): string {
  return createHmac("sha256", secret).update(raw, "utf8").digest("hex");
}

function apiKeyOk(scope = "read_write") {
  mocks.resolveApiKey.mockResolvedValue({
    kind: "ok",
    context: { userId: "u_1", keyId: "k_1", scope, prefix: "cn_live_test" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.RECALL_API_KEY;
  process.env.RECALL_WEBHOOK_SECRET = "test-recall-secret";
  mocks.checkRateLimit.mockResolvedValue({ success: true });
  mocks.userFindUnique.mockResolvedValue({ id: "u_1", teamId: "t_1" });
  mocks.botCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
    id: "bs_1",
    ...args.data,
  }));
  mocks.botUpdate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
    id: "bs_1",
    ...args.data,
  }));
  mocks.botFindMany.mockResolvedValue([]);
  mocks.botFindFirst.mockResolvedValue(null);
  mocks.emitMeetingReady.mockResolvedValue({ enqueued: 0 });
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ id: "rb_1", status: "joining" }), { status: 200 }));
});

describe("POST /api/v1/bots URL validation", () => {
  it.each([
    ["zoom", ZOOM, "zoom"],
    ["google meet", MEET, "google-meet"],
    ["teams", TEAMS, "microsoft-teams"],
  ])("accepts %s URLs", async (_label, url, platform) => {
    apiKeyOk();
    const res = await BotsPOST(botsPost({ meetingUrl: url, title: "Sync" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.platform).toBe(platform);
    expect(body.meetingUrl).toBe(url);
    expect(body.id).toBe("bs_1");
  });

  it("rejects garbage URLs with 400", async () => {
    apiKeyOk();
    const res = await BotsPOST(botsPost({ meetingUrl: "not-a-meeting-link" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_MEETING_URL");
    expect(mocks.botCreate).not.toHaveBeenCalled();
  });

  it("rejects missing meetingUrl with 400", async () => {
    apiKeyOk();
    const res = await BotsPOST(botsPost({}));
    expect(res.status).toBe(400);
    expect(mocks.botCreate).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/bots manual mode without RECALL_API_KEY", () => {
  it("stores pending_manual without calling fetch", async () => {
    delete process.env.RECALL_API_KEY;
    apiKeyOk();
    const res = await BotsPOST(botsPost({ meetingUrl: ZOOM }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("manual");
    expect(body.status).toBe("pending_manual");
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.botUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "pending_manual" }) }),
    );
  });
});

describe("dual-auth 401/403 paths", () => {
  it("returns 401 with no API key and no Clerk session (POST)", async () => {
    mocks.resolveApiKey.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ userId: null });
    const res = await BotsPOST(botsPost({ meetingUrl: ZOOM }));
    expect(res.status).toBe(401);
    expect(mocks.botCreate).not.toHaveBeenCalled();
  });

  it("returns 401 with no API key and no Clerk session (GET)", async () => {
    mocks.resolveApiKey.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ userId: null });
    const res = await BotsGET(new Request("http://x/api/v1/bots"));
    expect(res.status).toBe(401);
    expect(mocks.botFindMany).not.toHaveBeenCalled();
  });

  it("returns 403 when a read-scoped key attempts POST", async () => {
    apiKeyOk("read");
    const res = await BotsPOST(botsPost({ meetingUrl: ZOOM }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/scope/i);
    expect(mocks.botCreate).not.toHaveBeenCalled();
  });

  it("returns 429 when the API-key bucket is exhausted", async () => {
    mocks.resolveApiKey.mockResolvedValue({ kind: "rate_limited", resetAt: Date.now() + 1000 });
    const res = await BotsPOST(botsPost({ meetingUrl: ZOOM }));
    expect(res.status).toBe(429);
  });
});

describe("POST /api/webhooks/recall signature gate", () => {
  it("returns 401 on a bad signature", async () => {
    const raw = JSON.stringify({ event: "bot.done", recallBotId: "rb_1" });
    const res = await RecallPOST(recallPost(raw, "bad-signature"));
    expect(res.status).toBe(401);
    expect(mocks.botFindFirst).not.toHaveBeenCalled();
  });

  it("returns 401 when the signature header is missing", async () => {
    const raw = JSON.stringify({ event: "bot.done", recallBotId: "rb_1" });
    const res = await RecallPOST(recallPost(raw, null));
    expect(res.status).toBe(401);
  });

  it("acks a validly-signed done event and updates the session", async () => {
    const raw = JSON.stringify({
      event: "bot.done",
      recallBotId: "rb_1",
      transcriptUrl: "https://example.com/t.json",
    });
    mocks.botFindFirst.mockResolvedValue({
      id: "bs_1",
      recallBotId: "rb_1",
      teamId: "t_1",
      userId: "u_1",
      title: "Sync",
    });
    const res = await RecallPOST(recallPost(raw, sign(raw, "test-recall-secret")));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(mocks.botUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "done" }) }),
    );
    expect(mocks.emitMeetingReady).toHaveBeenCalledWith(
      expect.objectContaining({ teamId: "t_1", userId: "u_1", botSessionId: "bs_1" }),
    );
  });
});
