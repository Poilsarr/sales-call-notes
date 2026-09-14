import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

describe("Homepage Events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trackEvent routes hero_view with variant", async () => {
    vi.stubGlobal("window", {});

    const { trackEvent } = await import("@/lib/analytics");
    const { track } = await import("@vercel/analytics");

    trackEvent("hero_view", { variant: "control" });

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "hero_view",
        expect.objectContaining({ variant: "control" }),
      );
    });
  });

  it("trackEvent routes cta_click with id, section, signedIn", async () => {
    vi.stubGlobal("window", {});

    const { trackEvent } = await import("@/lib/analytics");
    const { track } = await import("@vercel/analytics");

    trackEvent("cta_click", {
      id: "hero-cta",
      section: "hero",
      signedIn: false,
    });

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "cta_click",
        expect.objectContaining({
          id: "hero-cta",
          section: "hero",
          signedIn: false,
        }),
      );
    });
  });

  it.each(["film_play", "film_close", "film_end"] as const)(
    "trackEvent routes %s with film and duration_s",
    async (event) => {
      vi.stubGlobal("window", {});

      const { trackEvent } = await import("@/lib/analytics");
      const { track } = await import("@vercel/analytics");

      trackEvent(event, { film: "intro", duration_s: 12 });

      await vi.waitFor(() => {
        expect(track).toHaveBeenCalledWith(
          event,
          expect.objectContaining({ film: "intro", duration_s: 12 }),
        );
      });
    },
  );

  it("trackEvent routes section_view with section", async () => {
    vi.stubGlobal("window", {});

    const { trackEvent } = await import("@/lib/analytics");
    const { track } = await import("@vercel/analytics");

    trackEvent("section_view", { section: "pricing" });

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "section_view",
        expect.objectContaining({ section: "pricing" }),
      );
    });
  });

  it("pricing_calculator_used remains in the MarketingEvent union", async () => {
    vi.stubGlobal("window", {});

    const { trackEvent } = await import("@/lib/analytics");
    const { track } = await import("@vercel/analytics");

    trackEvent("pricing_calculator_used", { plan: "pro" });

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "pricing_calculator_used",
        expect.objectContaining({ plan: "pro" }),
      );
    });
  });
});
