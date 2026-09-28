import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  resolveApiKey: vi.fn(),
  getUserByClerkId: vi.fn(),
  checkRateLimit: vi.fn(),
  userFindUnique: vi.fn(),
  callFindUnique: vi.fn(),
  callFindMany: vi.fn(),
  callDelete: vi.fn(),
  callUpdate: vi.fn(),
  commentDeleteMany: vi.fn(),
  insightDeleteMany: vi.fn(),
  actionItemDeleteMany: vi.fn(),
  decisionDeleteMany: vi.fn(),
  nextStepDeleteMany: vi.fn(),
  speakerDeleteMany: vi.fn(),
  analyticsDeleteMany: vi.fn(),
  competitorMentionDeleteMany: vi.fn(),
  policyFindMany: vi.fn(),
  blobDel: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/resolve-api-key", () => ({ resolveApiKey: mocks.resolveApiKey }));
vi.mock("@/lib/get-user", () => ({ getUserByClerkId: mocks.getUserByClerkId }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findUnique: mocks.userFindUnique },
    call: {
      findUnique: mocks.callFindUnique,
      findMany: mocks.callFindMany,
      delete: mocks.callDelete,
      update: mocks.callUpdate,
    },
    callComment: { deleteMany: mocks.commentDeleteMany },
    callInsight: { deleteMany: mocks.insightDeleteMany },
    actionItem: { deleteMany: mocks.actionItemDeleteMany },
    decision: { deleteMany: mocks.decisionDeleteMany },
    nextStep: { deleteMany: mocks.nextStepDeleteMany },
    speaker: { deleteMany: mocks.speakerDeleteMany },
    analytics: { deleteMany: mocks.analyticsDeleteMany },
    competitorMention: { deleteMany: mocks.competitorMentionDeleteMany },
    retentionPolicy: { findMany: mocks.policyFindMany },
  },
}));
vi.mock("@vercel/blob", () => ({ del: mocks.blobDel }));

import { GET as MeetingsGET, DELETE as MeetingsDELETE } from "@/app/api/v1/meetings/[id]/route";
import { POST as RetentionPOST } from "@/app/api/cron/retention/route";
import { isExpired, purgeCallData } from "@/lib/retention";
import { NextRequest } from "next/server";

const MEETING_ID = "meet_1";
const DB_ME = "db_me";
const DB_OTHER = "db_other";

function deleteReq(headers: Record<string, string> = {}): Request {
  return new Request(`http://x/api/v1/meetings/${MEETING_ID}`, {
    method: "DELETE",
    headers,
  });
}

function getReq(headers: Record<string, string> = {}): Request {
  return new Request(`http://x/api/v1/meetings/${MEETING_ID}`, {
    method: "GET",
    headers,
  });
}

function cronReq(secret: string | null): NextRequest {
  const headers: Record<string, string> = {};
  if (secret !== null) headers.authorization = `Bearer ${secret}`;
  return new NextRequest("http://x/api/cron/retention", { method: "POST", headers });
}

function apiKeyOk(scope = "read_write", userId = DB_ME) {
  mocks.resolveApiKey.mockResolvedValue({
    kind: "ok",
    context: { userId, keyId: "k_1", scope, prefix: "cn_live_test" },
  });
}

function clerkSession() {
  mocks.resolveApiKey.mockResolvedValue(null);
  mocks.auth.mockResolvedValue({ userId: "clerk_123" });
  mocks.checkRateLimit.mockResolvedValue({ success: true });
  mocks.getUserByClerkId.mockResolvedValue({ id: DB_ME, teamId: "t_me" });
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-cron-secret";
  mocks.checkRateLimit.mockResolvedValue({ success: true });
  mocks.userFindUnique.mockResolvedValue({ id: DB_ME, teamId: "t_me" });
  mocks.blobDel.mockResolvedValue(undefined);
  mocks.policyFindMany.mockResolvedValue([]);
  mocks.callDelete.mockResolvedValue({});
  mocks.callUpdate.mockResolvedValue({});
});

describe("isExpired", () => {
  it("returns true past the window, false inside it", () => {
    expect(isExpired(daysAgo(91), 90)).toBe(true);
    expect(isExpired(daysAgo(10), 90)).toBe(false);
  });

  it("rejects negative day windows", () => {
    expect(isExpired(daysAgo(1000), -1)).toBe(false);
  });
});

describe("DELETE /api/v1/meetings/[id] auth paths", () => {
  it("returns 401 with no API key and no Clerk session", async () => {
    mocks.resolveApiKey.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ userId: null });
    const res = await MeetingsDELETE(deleteReq(), {
      params: Promise.resolve({ id: MEETING_ID }),
    });
    expect(res.status).toBe(401);
    expect(mocks.callDelete).not.toHaveBeenCalled();
  });

  it("returns 404 when the meeting is missing", async () => {
    clerkSession();
    mocks.callFindUnique.mockResolvedValue(null);
    const res = await MeetingsDELETE(deleteReq(), {
      params: Promise.resolve({ id: MEETING_ID }),
    });
    expect(res.status).toBe(404);
    expect(mocks.callDelete).not.toHaveBeenCalled();
  });

  it("returns 403 for a foreign user/team call (Clerk path)", async () => {
    clerkSession();
    mocks.callFindUnique.mockResolvedValue({
      id: MEETING_ID,
      userId: DB_OTHER,
      teamId: "t_other",
    });
    const res = await MeetingsDELETE(deleteReq(), {
      params: Promise.resolve({ id: MEETING_ID }),
    });
    expect(res.status).toBe(403);
    expect(mocks.callDelete).not.toHaveBeenCalled();
    expect(mocks.blobDel).not.toHaveBeenCalled();
  });

  it("returns 403 on DELETE with a read-only API key scope", async () => {
    apiKeyOk("read");
    const res = await MeetingsDELETE(deleteReq({ authorization: "Bearer cn_test_x" }), {
      params: Promise.resolve({ id: MEETING_ID }),
    });
    expect(res.status).toBe(403);
    expect(mocks.callDelete).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/v1/meetings/[id] purge", () => {
  it("purges blob + all child rows + call, returns {deleted:true,id}", async () => {
    apiKeyOk("read_write");
    mocks.callFindUnique.mockResolvedValue({
      id: MEETING_ID,
      userId: DB_ME,
      teamId: null,
      audioUrl: "https://blob.example/m.mp3",
    });
    const res = await MeetingsDELETE(deleteReq({ authorization: "Bearer cn_test_x" }), {
      params: Promise.resolve({ id: MEETING_ID }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ deleted: true, id: MEETING_ID });
    expect(mocks.blobDel).toHaveBeenCalledWith("https://blob.example/m.mp3");
    expect(mocks.commentDeleteMany).toHaveBeenCalledWith({ where: { callId: MEETING_ID } });
    expect(mocks.insightDeleteMany).toHaveBeenCalledWith({ where: { callId: MEETING_ID } });
    expect(mocks.actionItemDeleteMany).toHaveBeenCalledWith({ where: { callId: MEETING_ID } });
    expect(mocks.decisionDeleteMany).toHaveBeenCalledWith({ where: { callId: MEETING_ID } });
    expect(mocks.nextStepDeleteMany).toHaveBeenCalledWith({ where: { callId: MEETING_ID } });
    expect(mocks.speakerDeleteMany).toHaveBeenCalledWith({ where: { callId: MEETING_ID } });
    expect(mocks.analyticsDeleteMany).toHaveBeenCalledWith({ where: { callId: MEETING_ID } });
    expect(mocks.competitorMentionDeleteMany).toHaveBeenCalledWith({
      where: { callId: MEETING_ID },
    });
    expect(mocks.callDelete).toHaveBeenCalledWith({ where: { id: MEETING_ID } });
  });
});

describe("purgeCallData", () => {
  it("still deletes rows when the blob delete throws", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.callFindUnique.mockResolvedValue({
      id: MEETING_ID,
      audioUrl: "https://blob.example/m.mp3",
    });
    mocks.blobDel.mockRejectedValue(new Error("blob outage"));
    const result = await purgeCallData({ callId: MEETING_ID, deleteAudio: mocks.blobDel });
    expect(mocks.callDelete).toHaveBeenCalledWith({ where: { id: MEETING_ID } });
    expect(result.deleted).toContain("call");
    warnSpy.mockRestore();
  });

  it("skips blob delete when audioUrl is null", async () => {
    mocks.callFindUnique.mockResolvedValue({ id: MEETING_ID, audioUrl: null });
    const result = await purgeCallData({ callId: MEETING_ID, deleteAudio: mocks.blobDel });
    expect(mocks.blobDel).not.toHaveBeenCalled();
    expect(result.deleted).not.toContain("blob");
    expect(mocks.callDelete).toHaveBeenCalled();
  });
});

describe("GET /api/v1/meetings/[id]", () => {
  it("returns the single meeting for the owner", async () => {
    apiKeyOk("read");
    mocks.callFindUnique.mockResolvedValue({
      id: MEETING_ID,
      userId: DB_ME,
      teamId: null,
      title: "Sync",
      summary: "Great call",
      healthScore: 82,
    });
    const res = await MeetingsGET(getReq({ authorization: "Bearer cn_test_x" }), {
      params: Promise.resolve({ id: MEETING_ID }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: MEETING_ID,
      title: "Sync",
      summary: "Great call",
      healthScore: 82,
      risk: expect.objectContaining({
        riskScore: expect.any(Number),
        missingFields: expect.any(Array),
        nextQuestions: expect.any(Array),
      }),
    });
  });

  it("returns 404 when the meeting is missing", async () => {
    apiKeyOk("read");
    mocks.callFindUnique.mockResolvedValue(null);
    const res = await MeetingsGET(getReq({ authorization: "Bearer cn_test_x" }), {
      params: Promise.resolve({ id: MEETING_ID }),
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/cron/retention CRON guard", () => {
  it("returns 401 without a bearer token", async () => {
    const res = await RetentionPOST(cronReq(null));
    expect(res.status).toBe(401);
    expect(mocks.callFindMany).not.toHaveBeenCalled();
  });

  it("returns 401 on a wrong secret", async () => {
    const res = await RetentionPOST(cronReq("wrong"));
    expect(res.status).toBe(401);
  });

  it("returns 500 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const res = await RetentionPOST(cronReq("test-cron-secret"));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/cron/retention defaults + sweep", () => {
  it("uses 90/365 defaults and fully purges ancient transcripts", async () => {
    mocks.policyFindMany.mockResolvedValue([]);
    mocks.callFindMany.mockResolvedValue([
      { id: "old_1", teamId: null, audioUrl: null, createdAt: daysAgo(400) },
    ]);
    mocks.callFindUnique.mockResolvedValue({ id: "old_1", audioUrl: null });
    const res = await RetentionPOST(cronReq("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ audioPurged: 0, callsPurged: 1 });
    expect(mocks.callDelete).toHaveBeenCalledWith({ where: { id: "old_1" } });
  });

  it("purges only audio (blob + null audioUrl) past audioDays but inside transcriptDays", async () => {
    mocks.policyFindMany.mockResolvedValue([]);
    mocks.callFindMany.mockResolvedValue([
      { id: "mid_1", teamId: null, audioUrl: "https://blob.example/mid.mp3", createdAt: daysAgo(100) },
    ]);
    const res = await RetentionPOST(cronReq("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ audioPurged: 1, callsPurged: 0 });
    expect(mocks.blobDel).toHaveBeenCalledWith("https://blob.example/mid.mp3");
    expect(mocks.callUpdate).toHaveBeenCalledWith({
      where: { id: "mid_1" },
      data: { audioUrl: null },
    });
    expect(mocks.callDelete).not.toHaveBeenCalled();
  });

  it("leaves fresh calls untouched", async () => {
    mocks.policyFindMany.mockResolvedValue([]);
    mocks.callFindMany.mockResolvedValue([
      { id: "new_1", teamId: null, audioUrl: "https://blob.example/new.mp3", createdAt: daysAgo(5) },
    ]);
    const res = await RetentionPOST(cronReq("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ audioPurged: 0, callsPurged: 0 });
    expect(mocks.blobDel).not.toHaveBeenCalled();
    expect(mocks.callDelete).not.toHaveBeenCalled();
  });

  it("honors deleteAudioOnly: skips transcript purge but still purges stale audio", async () => {
    mocks.policyFindMany.mockResolvedValue([
      { teamId: "t_1", audioDays: 90, transcriptDays: 365, deleteAudioOnly: true },
    ]);
    mocks.callFindMany.mockResolvedValue([
      {
        id: "keep_1",
        teamId: "t_1",
        audioUrl: "https://blob.example/keep.mp3",
        createdAt: daysAgo(400),
      },
    ]);
    const res = await RetentionPOST(cronReq("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ audioPurged: 1, callsPurged: 0 });
    expect(mocks.callDelete).not.toHaveBeenCalled();
    expect(mocks.callUpdate).toHaveBeenCalledWith({
      where: { id: "keep_1" },
      data: { audioUrl: null },
    });
  });
});
