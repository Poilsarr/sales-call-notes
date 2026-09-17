import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

const clerkState = vi.hoisted(() => ({
  user: null as { id: string } | null,
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: clerkState.user,
    isLoaded: true,
    isSignedIn: clerkState.user !== null,
  }),
  SignInButton: ({ children }: { children: unknown }) => children,
}));

import { track } from "@vercel/analytics";
import { HeroCTA } from "@/components/hero-cta";
import { HeroVideoPlayer } from "@/components/hero-video-player";
import StickyMarketingCta from "@/components/sticky-marketing-cta";

const mockTrack = vi.mocked(track);

function trackedCalls(event: string): Record<string, unknown>[] {
  return mockTrack.mock.calls
    .filter(([name]) => name === event)
    .map(([, props]) => (props ?? {}) as Record<string, unknown>);
}

describe("homepage marketing events (STAY PR-2)", () => {
  // NOTE: trackEvent() sends via dynamic import("@vercel/analytics").
  // Firing a second event before the first import resolves loses the
  // second call under vitest, so each test awaits the prior event
  // before triggering the next interaction.
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    clerkState.user = null;
    window.HTMLMediaElement.prototype.play = vi
      .fn()
      .mockResolvedValue(undefined) as unknown as () => Promise<void>;
    window.HTMLMediaElement.prototype.pause = vi.fn() as unknown as () => void;
  });

  it("fires hero_view {variant} once on hero mount", async () => {
    render(<HeroCTA />);

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "hero_view",
        expect.objectContaining({ variant: "B" }),
      );
    });
    expect(trackedCalls("hero_view")).toHaveLength(1);
  });

  it("fires cta_click {id: hero_start_free, section, signedIn: false} for anonymous hero press", async () => {
    render(<HeroCTA placement="hero" />);
    // Flush the mount-time hero_view import before clicking so the
    // click's dynamic import resolves deterministically (see note above).
    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "hero_view",
        expect.objectContaining({ variant: "B" }),
      );
    });

    fireEvent.click(screen.getByText("Start free"));

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "cta_click",
        expect.objectContaining({
          id: "hero_start_free",
          section: "hero",
          signedIn: false,
        }),
      );
    });
  });

  it("passes placement through as cta_click section", async () => {
    render(<HeroCTA placement="mobile-sticky" />);
    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "hero_view",
        expect.objectContaining({ variant: "B" }),
      );
    });

    fireEvent.click(screen.getByText("Start free"));

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "cta_click",
        expect.objectContaining({ section: "mobile-sticky" }),
      );
    });
  });

  it("fires cta_click {id: hero_dashboard, signedIn: true} when signed in", async () => {
    clerkState.user = { id: "user_1" };
    render(<HeroCTA />);
    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "hero_view",
        expect.objectContaining({ variant: "B" }),
      );
    });

    fireEvent.click(screen.getByText("Open dashboard"));

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "cta_click",
        expect.objectContaining({
          id: "hero_dashboard",
          section: "hero",
          signedIn: true,
        }),
      );
    });
  });

  it("fires film_play {film, duration_s} on play", async () => {
    render(<HeroVideoPlayer />);

    fireEvent.click(screen.getByLabelText(/Play The 2:14pm Call/));

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "film_play",
        expect.objectContaining({ film: "2-14pm-call", duration_s: 25 }),
      );
    });
  });

  it("fires film_close on X", async () => {
    render(<HeroVideoPlayer />);

    fireEvent.click(screen.getByLabelText(/Play The 2:14pm Call/));
    fireEvent.click(await screen.findByLabelText("Close video"));

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "film_close",
        expect.objectContaining({ film: "2-14pm-call", duration_s: 25 }),
      );
    });
    expect(trackedCalls("film_end")).toHaveLength(0);
  });

  it("fires film_end (not film_close) on video ended", async () => {
    const { container } = render(<HeroVideoPlayer />);

    fireEvent.click(screen.getByLabelText(/Play The 2:14pm Call/));
    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "film_play",
        expect.objectContaining({ film: "2-14pm-call" }),
      );
    });
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    fireEvent.ended(video!);

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "film_end",
        expect.objectContaining({ film: "2-14pm-call", duration_s: 25 }),
      );
    });
    expect(trackedCalls("film_close")).toHaveLength(0);
  });

  it("fires cta_click {id: sticky} on sticky CTA press", async () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(800);
    render(
      <StickyMarketingCta
        label="Start with 300 free minutes/mo"
        href="/sign-up"
        cta="Start free"
      />,
    );

    fireEvent.click(await screen.findByText("Start free"));

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "cta_click",
        expect.objectContaining({
          id: "sticky",
          section: "sticky",
          signedIn: false,
        }),
      );
    });
  });

  it("keeps all homepage event payloads anonymous (no email/clerkId)", async () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(800);
    const hero = render(<HeroCTA />);
    const player = render(<HeroVideoPlayer />);
    const sticky = render(
      <StickyMarketingCta
        label="Start with 300 free minutes/mo"
        href="/sign-up"
        cta="Start free"
      />,
    );

    fireEvent.click(within(hero.container).getByText("Start free"));
    fireEvent.click(
      within(player.container).getByLabelText(/Play The 2:14pm Call/),
    );
    fireEvent.click(within(sticky.container).getByText("Start free"));

    await vi.waitFor(() => {
      expect(mockTrack.mock.calls.length).toBeGreaterThan(0);
    });

    for (const [, props] of mockTrack.mock.calls) {
      const keys = Object.keys((props ?? {}) as Record<string, unknown>);
      expect(keys).not.toContain("email");
      expect(keys).not.toContain("clerkId");
      expect(keys).not.toContain("userId");
    }
  });
});
