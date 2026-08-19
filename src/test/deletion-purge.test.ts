import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  getUserMock,
  logAuditMock,
  captureApiErrorMock,
  blobDelMock,
  callFindUniqueMock,
  callFindManyMock,
  callDeleteMock,
  userUpdateMock,
  userDeleteMock,
  teamFindManyMock,
  commentDeleteManyMock,
  insightDeleteManyMock,
  actionItemDeleteManyMock,
  decisionDeleteManyMock,
  nextStepDeleteManyMock,
  speakerDeleteManyMock,
  analyticsDeleteManyMock,
  competitorMentionDeleteManyMock,
  callDeleteManyMock,
  apiKeyDeleteManyMock,
  notificationDeleteManyMock,
  knowledgeEntityDeleteManyMock,
  knowledgeRelationDeleteManyMock,
  rateLimitDeleteManyMock,
  vocabularyDeleteManyMock,
  integrationDeleteManyMock,
  teamDeleteManyMock,
  transactionMock,
  txOrder,
  prismaMock,
} = vi.hoisted(() => {
  const makeTxRecorder = (name: string) => {
    const fn = vi.fn(async () => {
      txOrder.push(name);
    });
    return fn;
  };

  const tx = {
    callComment: { deleteMany: makeTxRecorder("callComment") },
    callInsight: { deleteMany: makeTxRecorder("callInsight") },
    actionItem: { deleteMany: makeTxRecorder("actionItem") },
    decision: { deleteMany: makeTxRecorder("decision") },
    nextStep: { deleteMany: makeTxRecorder("nextStep") },
    speaker: { deleteMany: makeTxRecorder("speaker") },
    analytics: { deleteMany: makeTxRecorder("analytics") },
    competitorMention: { deleteMany: makeTxRecorder("competitorMention") },
    call: { deleteMany: makeTxRecorder("call") },
    apiKey: { deleteMany: makeTxRecorder("apiKey") },
    notification: { deleteMany: makeTxRecorder("notification") },
    knowledgeEntity: { deleteMany: makeTxRecorder("knowledgeEntity") },
    knowledgeRelation: { deleteMany: makeTxRecorder("knowledgeRelation") },
    rateLimit: { deleteMany: makeTxRecorder("rateLimit") },
    vocabularyEntry: { deleteMany: makeTxRecorder("vocabularyEntry") },
    integration: { deleteMany: makeTxRecorder("integration") },
    team: { deleteMany: makeTxRecorder("team") },
    user: { delete: makeTxRecorder("user") },
  };

  const txOrder: string[] = [];

  const transactionMock = vi.fn(async (cb: (tx: Record<string, unknown>) => Promise<unknown>) => cb(tx));

  const prismaMock = {
    call: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    callComment: { deleteMany: vi.fn() },
    callInsight: { deleteMany: vi.fn() },
    actionItem: { deleteMany: vi.fn() },
    decision: { deleteMany: vi.fn() },
    nextStep: { deleteMany: vi.fn() },
    speaker: { deleteMany: vi.fn() },
    analytics: { deleteMany: vi.fn() },
    competitorMention: { deleteMany: vi.fn() },
    apiKey: { deleteMany: vi.fn() },
    notification: { deleteMany: vi.fn() },
    knowledgeEntity: { deleteMany: vi.fn() },
    knowledgeRelation: { deleteMany: vi.fn() },
    rateLimit: { deleteMany: vi.fn() },
    vocabularyEntry: { deleteMany: vi.fn() },
    integration: { deleteMany: vi.fn() },
    team: { findMany: vi.fn(), deleteMany: vi.fn() },
    user: { update: vi.fn(), delete: vi.fn() },
    $transaction: transactionMock,
  };

  return {
    authMock: vi.fn(),
    getUserMock: vi.fn(),
    logAuditMock: vi.fn(),
    captureApiErrorMock: vi.fn(),
    blobDelMock: vi.fn(),
    callFindUniqueMock: prismaMock.call.findUnique,
    callFindManyMock: prismaMock.call.findMany,
    callDeleteMock: prismaMock.call.delete,
    callDeleteManyMock: prismaMock.call.deleteMany,
    userUpdateMock: prismaMock.user.update,
    userDeleteMock: prismaMock.user.delete,
    teamFindManyMock: prismaMock.team.findMany,
    commentDeleteManyMock: prismaMock.callComment.deleteMany,
    insightDeleteManyMock: prismaMock.callInsight.deleteMany,
    actionItemDeleteManyMock: prismaMock.actionItem.deleteMany,
    decisionDeleteManyMock: prismaMock.decision.deleteMany,
    nextStepDeleteManyMock: prismaMock.nextStep.deleteMany,
    speakerDeleteManyMock: prismaMock.speaker.deleteMany,
    analyticsDeleteManyMock: prismaMock.analytics.deleteMany,
    competitorMentionDeleteManyMock: prismaMock.competitorMention.deleteMany,
    apiKeyDeleteManyMock: prismaMock.apiKey.deleteMany,
    notificationDeleteManyMock: prismaMock.notification.deleteMany,
    knowledgeEntityDeleteManyMock: prismaMock.knowledgeEntity.deleteMany,
    knowledgeRelationDeleteManyMock: prismaMock.knowledgeRelation.deleteMany,
    rateLimitDeleteManyMock: prismaMock.rateLimit.deleteMany,
    vocabularyDeleteManyMock: prismaMock.vocabularyEntry.deleteMany,
    integrationDeleteManyMock: prismaMock.integration.deleteMany,
    teamDeleteManyMock: prismaMock.team.deleteMany,
    transactionMock,
    txOrder,
    prismaMock,
  };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: getUserMock,
}));

vi.mock("@/lib/audit-logger", () => ({
  logAuditAction: logAuditMock,
}));

vi.mock("@/lib/sentry", () => ({
  captureApiError: captureApiErrorMock,
}));

vi.mock("@vercel/blob", () => ({
  del: blobDelMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
  prisma: prismaMock,
}));

import { DELETE } from "@/app/api/history/[id]/route";
import { POST } from "@/app/api/user/delete/route";

const CLERK_USER_ID = "user_2xxx";
const DB_USER_ID = "db_user_1";

const VIEWER = { id: DB_USER_ID, teamId: null, teamRole: "OWNER" };

function historyDelete(audioUrl: string | null) {
  callFindUniqueMock.mockResolvedValue({
    id: "call_1",
    userId: DB_USER_ID,
    teamId: null,
    sharedWithTeam: false,
    audioUrl,
  });
  return DELETE(new Request("http://x/api/history/call_1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "call_1" }),
  });
}

describe("DELETE /api/history/[id] — blob purge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ userId: CLERK_USER_ID });
    getUserMock.mockResolvedValue(VIEWER);
    blobDelMock.mockResolvedValue(undefined);
  });

  it("deletes the audio blob with the call's audioUrl, then the rows", async () => {
    const response = await historyDelete("https://blob.example/a.mp3");

    expect(response.status).toBe(200);
    expect(blobDelMock).toHaveBeenCalledWith("https://blob.example/a.mp3");
    expect(commentDeleteManyMock).toHaveBeenCalledWith({ where: { callId: "call_1" } });
    expect(callDeleteMock).toHaveBeenCalledWith({ where: { id: "call_1" } });
    expect(blobDelMock.mock.invocationCallOrder[0]).toBeLessThan(
      commentDeleteManyMock.mock.invocationCallOrder[0],
    );
  });

  it("still deletes the rows when blobDel throws (no rethrow)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    blobDelMock.mockRejectedValue(new Error("blob outage"));

    const response = await historyDelete("https://blob.example/a.mp3");

    expect(response.status).toBe(200);
    expect(callDeleteMock).toHaveBeenCalledWith({ where: { id: "call_1" } });
    expect(commentDeleteManyMock).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("skips blobDel when audioUrl is null", async () => {
    const response = await historyDelete(null);

    expect(response.status).toBe(200);
    expect(blobDelMock).not.toHaveBeenCalled();
    expect(callDeleteMock).toHaveBeenCalledWith({ where: { id: "call_1" } });
  });
});

describe("POST /api/user/delete — inline hard purge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txOrder.length = 0;
    authMock.mockResolvedValue({ userId: CLERK_USER_ID });
    getUserMock.mockResolvedValue({ ...VIEWER, email: "user@example.com" });
    userUpdateMock.mockResolvedValue({});
    callFindManyMock.mockResolvedValue([]);
    teamFindManyMock.mockResolvedValue([]);
    blobDelMock.mockResolvedValue(undefined);
  });

  it("nulls BYOK keys in the soft-delete anonymization", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    expect(userUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: DB_USER_ID },
        data: expect.objectContaining({
          email: expect.stringContaining("@anonymized.local"),
          byokOpenaiKey: null,
          byokGroqKey: null,
        }),
      }),
    );
  });

  it("purges all models in FK-safe order with the right FK columns", async () => {
    callFindManyMock.mockResolvedValue([
      { id: "call_1", audioUrl: null },
      { id: "call_2", audioUrl: null },
    ]);
    teamFindManyMock.mockResolvedValue([{ id: "team_1" }]);

    const response = await POST();

    expect(response.status).toBe(200);
    expect(callFindManyMock).toHaveBeenCalledWith({
      where: { userId: DB_USER_ID },
      select: { id: true, audioUrl: true },
    });
    expect(teamFindManyMock).toHaveBeenCalledWith({
      where: { ownerId: DB_USER_ID },
      select: { id: true },
    });
    expect(txOrder).toEqual([
      "callComment",
      "callInsight",
      "actionItem",
      "decision",
      "nextStep",
      "speaker",
      "analytics",
      "competitorMention",
      "call",
      "apiKey",
      "notification",
      "knowledgeEntity",
      "knowledgeRelation",
      "rateLimit",
      "vocabularyEntry",
      "integration",
      "team",
      "user",
    ]);
    expect(transactionMock.mock.calls[0][0]).toBeInstanceOf(Function);
  });

  it("deletes blobs before the transaction and keeps purging when blobDel throws", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    callFindManyMock.mockResolvedValue([
      { id: "call_1", audioUrl: "https://blob.example/a.mp3" },
      { id: "call_2", audioUrl: null },
    ]);
    blobDelMock.mockRejectedValue(new Error("blob outage"));

    const response = await POST();

    expect(response.status).toBe(200);
    expect(blobDelMock).toHaveBeenCalledWith("https://blob.example/a.mp3");
    expect(transactionMock).toHaveBeenCalled();
    expect(userDeleteMock).not.toHaveBeenCalled();
    expect(txOrder).toContain("user");
    warnSpy.mockRestore();
  });

  it("returns 500 and reports to sentry when the purge transaction fails", async () => {
    callFindManyMock.mockResolvedValue([]);
    transactionMock.mockRejectedValueOnce(new Error("db down"));

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("purge failed");
    expect(captureApiErrorMock).toHaveBeenCalledWith("/api/user/delete", expect.anything(), {
      method: "POST",
    });
  });
});
