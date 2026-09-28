import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const SIGNING_SECRET = "test-signing-secret";
const APP_URL = "https://app.example.com";

const mocks = vi.hoisted(() => ({
  prisma: {
    integration: { findMany: vi.fn() },
    call: { findUnique: vi.fn() },
  },
  getSecret: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));
vi.mock("@/lib/secrets", () => ({ getSecret: mocks.getSecret }));

// Real decryptConfig passes legacy plaintext through (no ENCRYPTION_KEY set),
// so JSON-stringified stored configs just work.

import { POST } from "@/app/api/slack/events/route";

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function sign(raw: string, timestamp: string): string {
  const hmac = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(`v0:${timestamp}:${raw}`)
    .digest("hex");
  return `v0=${hmac}`;
}

function makeReq(raw: string, signature: string, timestamp: string) {
  return {
    text: () => Promise.resolve(raw),
    headers: {
      get: (name: string) => {
        const lower = name.toLowerCase();
        if (lower === "x-slack-signature") return signature;
        if (lower === "x-slack-request-timestamp") return timestamp;
        return null;
      },
    },
  } as any;
}

function signedReq(payload: unknown) {
  const raw = JSON.stringify(payload);
  const ts = String(Math.floor(Date.now() / 1000));
  return makeReq(raw, sign(raw, ts), ts);
}

const storedConfig = (teamId: string, accessToken = "xoxb-test-token") =>
  JSON.stringify({ teamId, accessToken });

describe("POST /api/slack/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSecret.mockImplementation((key: string) => {
      if (key === "SLACK_SIGNING_SECRET") return SIGNING_SECRET;
      if (key === "NEXT_PUBLIC_APP_URL") return APP_URL;
      return "";
    });
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  });

  it("answers the url_verification challenge handshake", async () => {
    const res = await POST(signedReq({ type: "url_verification", challenge: "abc123" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ challenge: "abc123" });
  });

  it("rejects requests with a bad signature (401)", async () => {
    const raw = JSON.stringify({ type: "url_verification", challenge: "x" });
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await POST(makeReq(raw, "v0=deadbeef", ts));
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("ignores link_shared events with no call links (no unfurl)", async () => {
    mocks.prisma.integration.findMany.mockResolvedValue([
      { id: "int-1", teamId: "team-1", config: storedConfig("T123") },
    ]);

    const res = await POST(
      signedReq({
        type: "event_callback",
        team_id: "T123",
        event: {
          type: "link_shared",
          channel: "C1",
          message_ts: "123.456",
          links: [{ url: `${APP_URL}/pricing`, domain: "app.example.com" }],
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.prisma.call.findUnique).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("unfurls /app/calls/{id} links via chat.unfurl with the bot token", async () => {
    mocks.prisma.integration.findMany.mockResolvedValue([
      { id: "int-1", teamId: "team-1", config: storedConfig("T123") },
    ]);
    mocks.prisma.call.findUnique.mockResolvedValue({
      id: "call-1",
      teamId: "team-1",
      title: "Acme discovery",
      filename: "acme.mp3",
      summary: "Agreed on pilot.",
      healthScore: 82,
    });

    const sharedUrl = `${APP_URL}/app/calls/call-1`;
    const res = await POST(
      signedReq({
        type: "event_callback",
        team_id: "T123",
        event: {
          type: "link_shared",
          channel: "C1",
          message_ts: "123.456",
          links: [{ url: sharedUrl, domain: "app.example.com" }],
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(mocks.prisma.call.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "call-1" } }),
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, opts] = mockFetch.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(url).toContain("chat.unfurl");
    expect(opts.headers.Authorization).toBe("Bearer xoxb-test-token");
    const body = JSON.parse(opts.body) as {
      channel: string;
      ts: string;
      unfurls: Record<string, { text: string; blocks: unknown[] }>;
    };
    expect(body.channel).toBe("C1");
    expect(body.ts).toBe("123.456");
    const unfurl = body.unfurls[sharedUrl];
    expect(unfurl).toBeDefined();
    const joined = JSON.stringify(unfurl.blocks);
    expect(joined).toContain("Acme discovery");
    expect(joined).toContain("Agreed on pilot.");
    expect(joined).toContain("82%");
  });

  it("ignores events from a workspace with no matching integration", async () => {
    mocks.prisma.integration.findMany.mockResolvedValue([
      { id: "int-1", teamId: "team-1", config: storedConfig("T999") },
    ]);

    const res = await POST(
      signedReq({
        type: "event_callback",
        team_id: "T123",
        event: {
          type: "link_shared",
          channel: "C1",
          message_ts: "123.456",
          links: [{ url: `${APP_URL}/app/calls/call-9`, domain: "app.example.com" }],
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.prisma.call.findUnique).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
