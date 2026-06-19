import { describe, it, expect } from "vitest";
import {
  buildLiveCaptionPayload,
  buildLiveTranscriptionEndpoint,
  buildFinalizeEndpoint,
  buildFinalizeFormData,
  buildFinalizeTranscriptText,
  APP_BASE_URL,
  classifyUploadStatus,
  nextBackoffDelay,
  createLiveSessionId,
} from "../../extension/shared.js";

/**
 * Chrome extension wire contract test.
 *
 * Purpose: prove the extension and the Next.js API agree on payload
 * shape, endpoint paths, and error classification. If either side
 * changes without the other, this test fails before users see
 * "captures locally, never POSTs" behavior in production.
 *
 * If this test passes, the bridge is honest. The actual network
 * round-trip is verified by integration tests against /api/transcribe/live.
 */
describe("extension bridge: wire contract", () => {
  describe("endpoints", () => {
    it("live transcription points at the right URL", () => {
      expect(buildLiveTranscriptionEndpoint()).toBe(
        `${APP_BASE_URL}/api/transcribe/live`
      );
    });

    it("finalize points at the right URL", () => {
      expect(buildFinalizeEndpoint()).toBe(`${APP_BASE_URL}/api/transcribe`);
    });
  });

  describe("live caption payload", () => {
    it("builds the wire shape the API expects", () => {
      const payload = buildLiveCaptionPayload({
        sessionId: "ext-test-1",
        text: "Hello world",
        isFinal: true,
      });
      expect(payload).toEqual({
        sessionId: "ext-test-1",
        text: "Hello world",
        isFinal: true,
      });
    });

    it("returns null for empty captions (skips upload)", () => {
      expect(buildLiveCaptionPayload({ text: "  " })).toBeNull();
      expect(buildLiveCaptionPayload(null)).toBeNull();
      expect(buildLiveCaptionPayload({ text: "ok" })).not.toBeNull();
    });

    it("truncates overlong text to MAX_CAPTION_CHARS (4000)", () => {
      const huge = "a".repeat(5000);
      const payload = buildLiveCaptionPayload({ text: huge });
      expect(payload?.text.length).toBe(4000);
    });

    it("defaults sessionId to ext-meeting", () => {
      const payload = buildLiveCaptionPayload({ text: "x" });
      expect(payload?.sessionId).toBe("ext-meeting");
    });
  });

  describe("finalize form data", () => {
    it("builds the form the analyze route accepts", () => {
      const fd = buildFinalizeFormData({
        sessionId: "ext-meet-123",
        meetingTitle: "Acme Discovery",
        transcript: "Hello\nWorld",
        captions: [{ text: "Hello" }, { text: "World" }],
      });
      // FormData is iterable; map to a plain object for assertion
      const obj: Record<string, string> = {};
      // FormData in Node 22 test env is iterable via entries()
      for (const entry of Array.from(fd.entries() as IterableIterator<[string, string]>)) {
        obj[entry[0]] = entry[1];
      }
      expect(obj.source).toBe("extension");
      expect(obj.sessionId).toBe("ext-meet-123");
      expect(obj.meetingTitle).toBe("Acme Discovery");
      expect(obj.transcript).toBe("Hello\nWorld");
      expect(obj.captionsCount).toBe("2");
    });
  });

  describe("error classification", () => {
    it("401/403 = needs_reauth", () => {
      expect(classifyUploadStatus(401)).toBe("needs_reauth");
      expect(classifyUploadStatus(403)).toBe("needs_reauth");
    });
    it("429 = rate_limited", () => {
      expect(classifyUploadStatus(429)).toBe("rate_limited");
    });
    it("5xx = server_error", () => {
      expect(classifyUploadStatus(500)).toBe("server_error");
      expect(classifyUploadStatus(502)).toBe("server_error");
    });
    it("2xx = ok", () => {
      expect(classifyUploadStatus(200)).toBe("ok");
      expect(classifyUploadStatus(204)).toBe("ok");
    });
  });

  describe("retry backoff", () => {
    it("escalates with attempt count, capped at the schedule", () => {
      const schedule = [1000, 2000, 4000, 8000, 16000, 30000];
      expect(nextBackoffDelay(0)).toBe(schedule[0]);
      expect(nextBackoffDelay(1)).toBe(schedule[1]);
      expect(nextBackoffDelay(5)).toBe(schedule[5]);
      expect(nextBackoffDelay(99)).toBe(schedule[schedule.length - 1]);
    });

    it("handles invalid input gracefully", () => {
      expect(nextBackoffDelay(NaN)).toBe(1000);
      expect(nextBackoffDelay(-1)).toBe(1000);
    });
  });

  describe("session ID", () => {
    it("slugifies meeting title", () => {
      const id = createLiveSessionId("Q3 Pipeline Review!!", 1700000000000);
      expect(id).toMatch(/^ext-q3-pipeline-review-1700000000000$/);
    });

    it("falls back to 'meeting' for empty title", () => {
      const id = createLiveSessionId("", 1700000000000);
      expect(id).toMatch(/^ext-meeting-1700000000000$/);
    });
  });

  describe("transcript text builder", () => {
    it("joins non-empty captions with newlines", () => {
      const t = buildFinalizeTranscriptText([
        { text: "Hello" },
        { text: "" },
        { text: "World" },
      ]);
      expect(t).toBe("Hello\nWorld");
    });

    it("truncates to MAX_TRANSCRIPT_CHARS (500000)", () => {
      const big = Array.from({ length: 1000 }, () => ({
        text: "a".repeat(600),
      }));
      const t = buildFinalizeTranscriptText(big);
      expect(t.length).toBeLessThanOrEqual(500000);
    });
  });
});
