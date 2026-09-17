import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics";
import {
  HeroScrubbableVideo,
  HERO_SCRUBBABLE_DURATION_S,
  HERO_SCRUBBABLE_VIDEO_SRC,
  HERO_SCRUBBABLE_POSTER_SRC,
  HERO_SCRUBBABLE_LINES,
} from "@/components/hero-scrubbable-video";

const mockTrackEvent = vi.mocked(trackEvent);

describe("HeroScrubbableVideo — duration truth + 4-line scrub + LCP poster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLMediaElement.prototype.play = vi
      .fn()
      .mockResolvedValue(undefined) as unknown as () => Promise<void>;
  });

  it("pins container truth to 39s (35s story + 4s pad, VTT 00:00–00:39)", () => {
    expect(HERO_SCRUBBABLE_DURATION_S).toBe(39);
  });

  it("defaults VIDEO + POSTER to the mgmt-35s mp4 / poster pair", () => {
    expect(HERO_SCRUBBABLE_VIDEO_SRC).toContain("gauge-hero-mgmt-35s.mp4");
    expect(HERO_SCRUBBABLE_POSTER_SRC).toContain(
      "gauge-hero-mgmt-poster.jpg",
    );
  });

  it("renders 4 tappable scrub buttons matching the 4 VTT cues", () => {
    render(<HeroScrubbableVideo />);
    const buttons = screen.getAllByRole("button", { name: /scrub to/i });
    expect(buttons).toHaveLength(4);
    expect(HERO_SCRUBBABLE_LINES.map((l) => l.seekS)).toEqual([2, 12, 22, 32]);
    expect(screen.getByRole("button", { name: /hook at 2 seconds/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /how it works at 12 seconds/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /notes at 22 seconds/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /slack alert at 32 seconds/i })).toBeDefined();
  });

  it("labels the real 39s duration on facade, video, and pill", () => {
    render(<HeroScrubbableVideo />);
    expect(
      screen.getByRole("button", { name: /39 seconds, sound off/i }),
    ).toBeDefined();
    expect(screen.getByText("For management — 0:39, sound off")).toBeDefined();
    expect(screen.getByText("00:00–00:39")).toBeDefined();
  });

  it("keeps the LCP poster facade: high fetchPriority, async decoding, zero video bytes", () => {
    const { container } = render(<HeroScrubbableVideo />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toContain("gauge-hero-mgmt-poster.jpg");
    expect(img?.getAttribute("fetchpriority")).toBe("high");
    expect(img?.getAttribute("decoding")).toBe("async");
    expect(container.querySelector("video")).toBeNull();
  });

  it("scrub seeks to the line timestamp, unmutes, and fires film_play once", () => {
    render(<HeroScrubbableVideo />);
    const lines = screen.getAllByRole("button", { name: /scrub to/i });

    fireEvent.click(lines[1]);
    fireEvent.click(lines[3]);

    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    // Last scrub wins: 32s Slack flag line.
    expect(video?.currentTime).toBe(32);
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      "film_play",
      expect.objectContaining({ film: "hero-scrubbable", duration_s: 39 }),
    );
  });
});
