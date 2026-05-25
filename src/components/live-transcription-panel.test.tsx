import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LiveTranscriptionPanel } from "@/components/live-transcription-panel";

class MockEventSource {
  static instances: MockEventSource[] = [];

  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;
  url: string;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close() {
    this.readyState = 2;
  }

  emit(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent<string>);
  }
}

describe("LiveTranscriptionPanel", () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal("EventSource", MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("connects to the SSE route and renders incoming transcript events", async () => {
    render(createElement(LiveTranscriptionPanel, { active: true, sessionId: "session-abc" }));

    expect(MockEventSource.instances[0]?.url).toContain("/api/transcribe/live?sessionId=session-abc");

    await act(async () => {
      MockEventSource.instances[0].emit({
        type: "connected",
        sessionId: "session-abc",
        message: "Live transcription ready",
      });
      MockEventSource.instances[0].emit({
        type: "transcript",
        sessionId: "session-abc",
        text: "Prospect: I need pricing details",
        isFinal: true,
        timestamp: 1000,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Prospect: I need pricing details")).toBeInTheDocument();
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });
  });

  it("shows a waiting state when inactive", () => {
    render(createElement(LiveTranscriptionPanel, { active: false, sessionId: "idle-session" }));

    expect(screen.getByText(/Start a live session to stream captions here/)).toBeInTheDocument();
    expect(MockEventSource.instances).toHaveLength(0);
  });
});
