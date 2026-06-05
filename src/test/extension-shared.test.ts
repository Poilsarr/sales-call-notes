import { describe, expect, it } from "vitest";

import {
  APP_BASE_URL,
  buildLiveRecordUrl,
  buildLiveTranscriptionEndpoint,
  createLiveSessionId,
  normalizeCaptionBatch,
} from "../../extension/shared.js";

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
});
