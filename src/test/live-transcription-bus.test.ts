import { describe, expect, it, vi } from "vitest";

import {
  publishLiveTranscriptionEvent,
  resetLiveTranscriptionSessions,
  subscribeToLiveTranscriptionSession,
} from "@/lib/live-transcription-bus";

describe("live transcription session bus", () => {
  it("publishes transcript events to active subscribers", () => {
    resetLiveTranscriptionSessions();
    const listener = vi.fn();

    const subscription = subscribeToLiveTranscriptionSession("session-1", listener);

    publishLiveTranscriptionEvent("session-1", {
      type: "transcript",
      sessionId: "session-1",
      text: "hello from live captions",
      isFinal: true,
      timestamp: 123,
    });

    expect(subscription.backlog).toEqual([]);
    expect(listener).toHaveBeenCalledWith({
      type: "transcript",
      sessionId: "session-1",
      text: "hello from live captions",
      isFinal: true,
      timestamp: 123,
    });
  });

  it("replays backlog to new subscribers and stops after unsubscribe", () => {
    resetLiveTranscriptionSessions();
    const firstListener = vi.fn();

    const subscription = subscribeToLiveTranscriptionSession("session-2", firstListener);
    publishLiveTranscriptionEvent("session-2", {
      type: "transcript",
      sessionId: "session-2",
      text: "first segment",
      isFinal: false,
      timestamp: 1,
    });
    subscription.unsubscribe();

    publishLiveTranscriptionEvent("session-2", {
      type: "transcript",
      sessionId: "session-2",
      text: "second segment",
      isFinal: true,
      timestamp: 2,
    });

    const secondListener = vi.fn();
    const replay = subscribeToLiveTranscriptionSession("session-2", secondListener);

    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(replay.backlog).toEqual([
      {
        type: "transcript",
        sessionId: "session-2",
        text: "first segment",
        isFinal: false,
        timestamp: 1,
      },
      {
        type: "transcript",
        sessionId: "session-2",
        text: "second segment",
        isFinal: true,
        timestamp: 2,
      },
    ]);
    expect(secondListener).not.toHaveBeenCalled();
  });
});
