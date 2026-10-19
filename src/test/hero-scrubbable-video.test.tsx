import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import type { ComponentType } from "react";

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

/**
 * HOMEPAGE-V2 (E1 rebuild, landing in parallel): HeroScrubbableVideo is
 * VIDEO ONLY — the 4-line scrub list + Health/Rival footer move to the NEW
 * ScrubSummarySection below the fold, and the video seeks via a window
 * `gauge:scrub` CustomEvent `{seekS}` instead of in-panel buttons.
 *
 * These tests resolve the scrub surface FRESH per run: when E1's new module
 * exists the scrub assertions target it; otherwise they cover the same lines
 * inside the hero panel (pre-rebuild reality). Facade + film_play truths
 * hold in both worlds.
 *
 * NOTE: the specifier is a `string` (not a literal) on purpose — a static
 * import would fail module resolution (tsc + vitest) until E1's file lands.
 */
async function loadScrubSummary(): Promise<{
  ScrubSummarySection: ComponentType;
} | null> {
  const specifier: string = "@/components/scrub-summary-section";
  try {
    return (await import(specifier)) as {
      ScrubSummarySection: ComponentType;
    };
  } catch {
    return null;
  }
}

describe("HeroScrubbableVideo — duration truth + video-only facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLMediaElement.prototype.play = vi
      .fn()
      .mockResolvedValue(undefined) as unknown as () => Promise<void>;
  });

  it("pins container truth to 15s (seamless loop, VTT 00:00–00:15)", () => {
    expect(HERO_SCRUBBABLE_DURATION_S).toBe(15);
  });

  it("defaults VIDEO + POSTER to the 15s loop mp4 / poster pair", () => {
    expect(HERO_SCRUBBABLE_VIDEO_SRC).toContain("gauge-hero-15s-loop.mp4");
    expect(HERO_SCRUBBABLE_POSTER_SRC).toContain(
      "gauge-hero-15s-poster.jpg",
    );
  });

  it("keeps the LCP poster facade: high fetchPriority, async decoding, zero video bytes", () => {
    const { container } = render(<HeroScrubbableVideo />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toContain("gauge-hero-15s-poster.jpg");
    expect(img?.getAttribute("fetchpriority")).toBe("high");
    expect(img?.getAttribute("decoding")).toBe("async");
    expect(container.querySelector("video")).toBeNull();
  });

  it("labels the real 15s duration on the facade play button + pill", () => {
    render(<HeroScrubbableVideo />);
    expect(
      screen.getByRole("button", { name: /15 seconds, sound off/i }),
    ).toBeDefined();
    expect(screen.getByText("Meet capture — 0:15 loop, sound off")).toBeDefined();
  });

  it("activating the facade mounts <video> and fires film_play once", () => {
    const { container } = render(<HeroScrubbableVideo />);
    fireEvent.click(
      screen.getByRole("button", { name: /15 seconds, sound off/i }),
    );
    expect(container.querySelector("video")).not.toBeNull();
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      "film_play",
      expect.objectContaining({ film: "hero-scrubbable", duration_s: 15 }),
    );
  });

  it("seeks on window 'gauge:scrub' CustomEvent {seekS} (E1 video-only contract)", async () => {
    const { container } = render(<HeroScrubbableVideo />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent("gauge:scrub", { detail: { seekS: 12 } }),
      );
    });

    if (await loadScrubSummary()) {
      // Post-rebuild: video listens for scrub events from the section below.
      await vi.waitFor(() => {
        const video = container.querySelector("video");
        expect(video).not.toBeNull();
        expect(video!.currentTime).toBe(12);
      });
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "film_play",
        expect.objectContaining({ film: "hero-scrubbable", duration_s: 15 }),
      );
    } else {
      // Pre-rebuild: no listener yet — the event is a harmless no-op and
      // zero video bytes have loaded.
      expect(container.querySelector("video")).toBeNull();
      expect(mockTrackEvent).not.toHaveBeenCalled();
    }
  });
});

describe("Scrub summary surface — 4 lines + stamps + health/rival footer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLMediaElement.prototype.play = vi
      .fn()
      .mockResolvedValue(undefined) as unknown as () => Promise<void>;
  });

  it("keeps the data export at 4 lines (stamps 00:01/04/08/12)", () => {
    expect(HERO_SCRUBBABLE_LINES.map((l) => l.seekS)).toEqual([1.5, 4.5, 8.5, 12]);
    expect(HERO_SCRUBBABLE_LINES.map((l) => l.stamp)).toEqual([
      "00:01",
      "00:04",
      "00:08",
      "00:12",
    ]);
  });

  it("renders all 4 lines with stamps, Live-summary header, and footer meta", async () => {
    const scrub = await loadScrubSummary();
    let scope: HTMLElement;
    if (scrub) {
      // Post-rebuild: lines live in the below-fold section.
      const { container } = render(<scrub.ScrubSummarySection />);
      scope = container as HTMLElement;
      expect(
        container.querySelector(
          '[data-testid="scrub-summary"], [data-track-section="scrub-summary"]',
        ),
      ).not.toBeNull();
    } else {
      // Pre-rebuild: lines still live inside the hero panel.
      const { container } = render(<HeroScrubbableVideo />);
      scope = container as HTMLElement;
    }

    const q = within(scope);
    expect(q.getByText(/Live summary/i)).toBeDefined();
    for (const line of HERO_SCRUBBABLE_LINES) {
      expect(q.getByText(line.text)).toBeDefined();
      expect(q.getByText(new RegExp(line.stamp.replace(":", "\\:")))).toBeDefined();
    }
    expect(q.getAllByRole("button")).toHaveLength(4);
    expect(q.getByText(/Health 8\.2/)).toBeDefined();
    expect(q.getByText(/Rival: Gong/)).toBeDefined();
    expect(q.getByText("#deal-room-acme", { exact: true })).toBeDefined();
  });

  it("tapping the 12s Slack line seeks the hero video (last scrub wins, film_play once)", async () => {
    const scrub = await loadScrubSummary();
    if (scrub) {
      // Post-rebuild: section button dispatches gauge:scrub → hero seeks.
      const hero = render(<HeroScrubbableVideo />);
      const section = render(<scrub.ScrubSummarySection />);
      const buttons = within(section.container).getAllByRole("button");
      expect(buttons).toHaveLength(4);
      fireEvent.click(buttons[1]);
      fireEvent.click(buttons[3]);
      await vi.waitFor(() => {
        const video = hero.container.querySelector("video");
        expect(video).not.toBeNull();
        expect(video!.currentTime).toBe(12);
      });
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "film_play",
        expect.objectContaining({ film: "hero-scrubbable", duration_s: 15 }),
      );
    } else {
      // Pre-rebuild: in-panel scrub buttons seek directly.
      render(<HeroScrubbableVideo />);
      const lines = screen.getAllByRole("button", { name: /scrub to/i });
      expect(lines).toHaveLength(4);

      fireEvent.click(lines[1]);
      fireEvent.click(lines[3]);

      const video = document.querySelector("video");
      expect(video).not.toBeNull();
      // Last scrub wins: 12s Slack signal line.
      expect(video?.currentTime).toBe(12);
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "film_play",
        expect.objectContaining({ film: "hero-scrubbable", duration_s: 15 }),
      );
    }
  });
});
