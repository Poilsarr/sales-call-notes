import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrismaFindUnique, mockBuildUserExport } = vi.hoisted(() => ({
  mockPrismaFindUnique: vi.fn(),
  mockBuildUserExport: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockPrismaFindUnique,
    },
  },
}));

vi.mock("@/lib/gdpr-export", () => ({
  buildUserExport: mockBuildUserExport,
}));

import { GET } from "@/app/api/user/export/download/route";
import { computeExportTokenHash, issueExportToken } from "@/lib/gdpr-token";

const SECRET = "test-export-secret-0123456789";
const USER_ID = "user_123";
const get = (token: string) =>
  GET(new Request(`http://localhost/api/user/export/download?token=${encodeURIComponent(token)}`));

describe("GET /api/user/export/download (HMAC verification)", () => {
  beforeEach(() => {
    process.env.EXPORT_TOKEN_SECRET = SECRET;
    mockPrismaFindUnique.mockReset().mockResolvedValue({ id: USER_ID });
    mockBuildUserExport.mockReset().mockResolvedValue({ calls: ["mock"] });
  });

  it("serves the export for a valid token", async () => {
    const token = issueExportToken(USER_ID, 60 * 1000)!;
    const res = await get(token);
    expect(res.status).toBe(200);
    expect(mockBuildUserExport).toHaveBeenCalledWith(USER_ID);
  });

  it("rejects a token with a forged hash (403) — regression: hash was never verified", async () => {
    const future = Date.now() + 60 * 1000;
    const forged = `exp_${future}_deadbeefdeadbeef_${USER_ID}`;
    const res = await get(forged);
    expect(res.status).toBe(403);
    expect(mockBuildUserExport).not.toHaveBeenCalled();
  });

  it("rejects an expired token with 410 even when the hash is correct", async () => {
    const pastMs = Date.now() - 1000;
    const token = `exp_${pastMs}_${computeExportTokenHash(USER_ID, pastMs)}_${USER_ID}`;
    const res = await get(token);
    expect(res.status).toBe(410);
    expect(mockBuildUserExport).not.toHaveBeenCalled();
  });

  it("returns 400 when the token is missing or malformed", async () => {
    expect((await get("")).status).toBe(400);
    expect((await get("garbage")).status).toBe(400);
    expect((await get("exp_notanumber_deadbeefdeadbeef_user_123")).status).toBe(400);
  });
});
