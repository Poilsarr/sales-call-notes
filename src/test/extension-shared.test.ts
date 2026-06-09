import { describe, expect, it, vi } from "vitest";

import {
  APP_BASE_URL,
  MAX_PENDING_CAPTIONS,
  buildAuthHeaders,
  buildFinalizeEndpoint,
  buildFinalizeFormData,
  buildFinalizeTranscriptText,
  buildLiveCaptionPayload,
  buildLiveRecordUrl,
  buildLiveTranscriptionEndpoint,
  buildSignInUrl,
  classifyUploadStatus,
  createLiveSessionId,
  getClerkSessionToken,
  nextBackoffDelay,
  normalizeCaptionBatch,
  recordUploadError,
  recordUploadPending,
  recordUploadSuccess,
} from "../../extension/shared.js";

import {
  EXTENSION_MAX_TRANSCRIPT_CHARS,
  UPLOAD_RETRY_POLICY,
  buildFinalizeFormData as buildServerFinalizePayload,
  buildLiveTranscriptPayload,
  classifyUploadStatus as classifyServerUploadStatus,
  isValidExtensionSource,
  sanitizeExtensionTitle,
  sanitizeSessionId,
} from "@/lib/extension-upload";

describe("extension shared helpers", () => {
  it("builds a live record URL that keeps the extension session id", () => {
    expect(buildLiveRecordUrl("ext-meet-123")).toBe(
      `${APP_BASE_URL}/app/record?liveSessionId=ext-meet-123&source=extension`,
    );
  });

  it("creates stable session ids from the meeting title", () => {
    expect(createLiveSessionId("Weekly Team Sync", 12345)).toBe("ext-weekly-team-sync-12345");
  });

  it("normalizes caption batches for storage and upload", () => {
    expect(
      normalizeCaptionBatch(
        [
          { text: " Prospect update ", timestamp: 1710000000000 },
          { text: "", timestamp: 1710000000001 },
        ],
        "Deal Review",
        "ext-deal-review-1710000000000",
      ),
    ).toEqual([
      {
        text: "Prospect update",
        meetingTitle: "Deal Review",
        sessionId: "ext-deal-review-1710000000000",
        timestamp: "2024-03-09T16:00:00.000Z",
      },
    ]);
  });

  it("exposes the live transcription endpoint on the production app origin", () => {
    expect(buildLiveTranscriptionEndpoint()).toBe(
      `${APP_BASE_URL}/api/transcribe/live`,
    );
  });

  it("points finalize uploads at the production /api/transcribe route", () => {
    expect(buildFinalizeEndpoint()).toBe(`${APP_BASE_URL}/api/transcribe`);
  });

  it("builds a sign-in URL that points back to the record page", () => {
    expect(buildSignInUrl("/app/record")).toBe(
      `${APP_BASE_URL}/sign-in?redirect_url=%2Fapp%2Frecord`,
    );
  });
});

describe("extension upload auth + error handling", () => {
  it("classifies HTTP statuses into actionable categories", () => {
    expect(classifyUploadStatus(200)).toBe("ok");
    expect(classifyUploadStatus(401)).toBe("needs_reauth");
    expect(classifyUploadStatus(403)).toBe("needs_reauth");
    expect(classifyUploadStatus(429)).toBe("rate_limited");
    expect(classifyUploadStatus(500)).toBe("server_error");
    expect(classifyUploadStatus(503)).toBe("server_error");
    expect(classifyUploadStatus(418)).toBe("client_error");
  });

  it("grows backoff delay up to the configured cap", () => {
    expect(nextBackoffDelay(0)).toBe(1000);
    expect(nextBackoffDelay(1)).toBe(2000);
    expect(nextBackoffDelay(3)).toBe(8000);
    expect(nextBackoffDelay(99)).toBe(30000);
    expect(nextBackoffDelay(-1)).toBe(1000);
  });

  it("builds Authorization headers when a token is present and skips them otherwise", () => {
    expect(buildAuthHeaders("jwt.value")).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer jwt.value",
    });
    expect(buildAuthHeaders(null)).toEqual({ "Content-Type": "application/json" });
  });

  it("reads the Clerk __session cookie via chrome.cookies.get", async () => {
    const get = vi.fn().mockResolvedValue({ value: "jwt.from.cookie" });
    const previous = (globalThis as Record<string, unknown>).chrome;
    (globalThis as Record<string, unknown>).chrome = { cookies: { get } };
    try {
      const token = await getClerkSessionToken();
      expect(token).toBe("jwt.from.cookie");
      expect(get).toHaveBeenCalledWith({ url: APP_BASE_URL, name: "__session" });
    } finally {
      (globalThis as Record<string, unknown>).chrome = previous;
    }
  });

  it("returns null when the cookies API is unavailable", async () => {
    const previous = (globalThis as Record<string, unknown>).chrome;
    (globalThis as Record<string, unknown>).chrome = {};
    try {
      expect(await getClerkSessionToken()).toBeNull();
    } finally {
      (globalThis as Record<string, unknown>).chrome = previous;
    }
  });

  it("swallows cookie read errors and returns null", async () => {
    const get = vi.fn().mockRejectedValue(new Error("denied"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const previous = (globalThis as Record<string, unknown>).chrome;
(globalThis as Record<string, unknown>).chrome = { cookies: { get } };
    try {
      expect(await getClerkSessionToken()).toBeNull();
      expect(warn).toHaveBeenCalled();
    } finally {
      (globalThis as Record<string, unknown>).chrome = previous;
      warn.mockRestore();
    }
  });
});

describe("extension caption + finalize payloads", () => {
  it("rejects empty captions and trims oversized ones", () => {
    expect(buildLiveCaptionPayload(null)).toBeNull();
    expect(buildLiveCaptionPayload({ text: "   " })).toBeNull();
    const huge = "x".repeat(MAX_PENDING_CAPTIONS);
    const trimmed = buildLiveCaptionPayload({
      text: huge,
      sessionId: "ext-test",
      isFinal: true,
    })!;
    expect(trimmed.text.length).toBeLessThanOrEqual(4000);
    expect(trimmed.sessionId).toBe("ext-test");
    expect(trimmed.isFinal).toBe(true);
  });

  it("joins captions into a single transcript bounded by MAX_TRANSCRIPT_CHARS", () => {
    const captions = [
      { text: "First speaker" },
      { text: " Second speaker " },
      { text: "" },
      { text: "Third" },
    ];
    const joined = buildFinalizeTranscriptText(captions);
    expect(joined).toBe("First speaker\nSecond speaker\nThird");

    const huge = "x".repeat(EXTENSION_MAX_TRANSCRIPT_CHARS + 1000);
    const overflow = buildFinalizeTranscriptText([{ text: huge }]);
    expect(overflow.length).toBe(EXTENSION_MAX_TRANSCRIPT_CHARS);
  });

  it("builds a finalize FormData payload with the expected fields", () => {
    const form = buildFinalizeFormData({
      sessionId: "ext-meeting-1",
      meetingTitle: "Q3 Deal Review",
      transcript: "Hello world",
      captions: [{ text: "Hello" }, { text: "world" }],
    });
    expect(form.get("source")).toBe("extension");
    expect(form.get("sessionId")).toBe("ext-meeting-1");
    expect(form.get("meetingTitle")).toBe("Q3 Deal Review");
    expect(form.get("transcript")).toBe("Hello world");
    expect(form.get("captionsCount")).toBe("2");
  });
});

describe("extension upload status persistence", () => {
  function installChrome() {
    const store: Record<string, unknown> = {};
    const set = vi.fn((value, cb) => {
      Object.assign(store, value);
      cb?.();
    });
    const previous = (globalThis as Record<string, unknown>).chrome;
    (globalThis as Record<string, unknown>).chrome = { storage: { local: { set } } };
    return {
      store,
      restore: () => {
        (globalThis as Record<string, unknown>).chrome = previous;
      },
    };
  }

  it("writes a success status with the batch count", async () => {
    const ctx = installChrome();
    try {
      await recordUploadSuccess(null, 5);
      expect((ctx.store as Record<string, unknown>).uploadStatus).toMatchObject({ state: "success", count: 5 });
      expect((ctx.store as Record<string, unknown>).lastUploadAt).toBeGreaterThan(0);
      expect((ctx.store as Record<string, unknown>).lastUploadError).toBeNull();
    } finally {
      ctx.restore();
    }
  });

  it("writes a pending status with the current attempt counter", async () => {
    const ctx = installChrome();
    try {
      await recordUploadPending(null, 3);
      expect(ctx.store.uploadStatus).toMatchObject({ state: "uploading", attempts: 3 });
      expect(ctx.store.pendingRetries).toBe(3);
    } finally {
      ctx.restore();
    }
  });

  it("writes an error status with the failure reason", async () => {
    const ctx = installChrome();
    try {
      await recordUploadError(null, "rate_limited", "Slow down");
      expect(ctx.store.uploadStatus).toMatchObject({ state: "error", status: "rate_limited" });
      expect((ctx.store.lastUploadError as { message: string }).message).toBe("Slow down");
    } finally {
      ctx.restore();
    }
  });
});

describe("server-side extension upload helpers", () => {
  it("matches the extension retry policy and transcript cap", () => {
    expect(UPLOAD_RETRY_POLICY.backoffMs).toEqual([1000, 2000, 4000, 8000, 16000, 30000]);
    expect(UPLOAD_RETRY_POLICY.maxAttempts).toBe(6);
    expect(EXTENSION_MAX_TRANSCRIPT_CHARS).toBe(500_000);
  });

  it("classifies statuses with the same shape as the extension", () => {
    expect(classifyServerUploadStatus(401)).toBe("needs_reauth");
    expect(classifyServerUploadStatus(429)).toBe("rate_limited");
    expect(classifyServerUploadStatus(500)).toBe("server_error");
    expect(classifyServerUploadStatus(200)).toBe("ok");
  });

  it("only accepts allow-listed source values", () => {
    expect(isValidExtensionSource("extension")).toBe(true);
    expect(isValidExtensionSource("web")).toBe(true);
    expect(isValidExtensionSource("live")).toBe(true);
    expect(isValidExtensionSource("../etc/passwd")).toBe(false);
    expect(isValidExtensionSource(null)).toBe(false);
    expect(isValidExtensionSource(undefined)).toBe(false);
  });

  it("strips newlines and bounds user-supplied meeting titles", () => {
    expect(sanitizeExtensionTitle("Hello\nWorld\t!")).toBe("Hello World !".replace("\t", " "));
    const huge = "x".repeat(1_000);
    const out = sanitizeExtensionTitle(huge);
    expect(out.length).toBe(200);
  });

  it("strips unsafe characters from session ids", () => {
    expect(sanitizeSessionId("ext-foo/../bar?x=1")).toBe("ext-foo-..-bar-x-1");
    expect(sanitizeSessionId("")).toBe("");
    const huge = "a".repeat(1_000);
    expect(sanitizeSessionId(huge).length).toBe(120);
  });

  it("builds a live transcript payload with sanitized text", () => {
    expect(buildLiveTranscriptPayload({ text: "  ", sessionId: "bad/id" })).toBeNull();
    const payload = buildLiveTranscriptPayload({
      text: " Hello ",
      sessionId: "ext-meeting-1",
      isFinal: true,
      meetingTitle: "Title\nWith\nBreaks",
    });
    expect(payload).toEqual({
      sessionId: "ext-meeting-1",
      text: "Hello",
      isFinal: true,
      meetingTitle: "Title With Breaks",
    });
  });

  it("returns null when finalize payload has neither transcript nor captions", () => {
    expect(buildServerFinalizePayload({ sessionId: "x", meetingTitle: "y" })).toBeNull();
  });

  it("builds a server-side finalize payload with sanitized fields", () => {
    const payload = buildServerFinalizePayload({
      sessionId: "ext-meeting-1",
      meetingTitle: "Q3\nReview",
      transcript: "Hello world",
      captions: [
        { text: " First ", timestamp: 1710000000000 },
        { text: " Second " },
        null,
      ],
    });
    expect(payload).toEqual({
      sessionId: "ext-meeting-1",
      meetingTitle: "Q3 Review",
      source: "extension",
      transcript: "Hello world",
      captions: [
        { text: "First", timestamp: "2024-03-09T16:00:00.000Z" },
        { text: "Second", timestamp: expect.any(String) },
      ],
    });
  });
});
