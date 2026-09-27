import { render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { initializePaddle } from "@paddle/paddle-js";
import type { Tier } from "@/lib/pricing-tiers";

const { clerkState } = vi.hoisted(() => ({
  clerkState: {
    isLoaded: true,
    isSignedIn: false,
    user: null as null | { id: string; primaryEmailAddress?: { emailAddress: string } },
  },
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: clerkState.user,
    isLoaded: clerkState.isLoaded,
    isSignedIn: clerkState.isSignedIn,
  }),
  SignInButton: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("@/components/pricing-calculator", () => ({
  default: () => <div />,
}));
vi.mock("@/components/exit-intent-modal", () => ({
  default: () => <div />,
}));
vi.mock("@/components/sticky-pricing-cta", () => ({
  default: () => <div />,
}));
vi.mock("@/components/pricing-social-proof", () => ({
  default: () => <div />,
}));
vi.mock("@/components/nav", () => ({
  default: () => <div data-testid="nav" />,
}));
vi.mock("@/components/sticky-marketing-cta", () => ({
  default: () => <div />,
}));

vi.mock("@paddle/paddle-js", () => ({
  initializePaddle: vi.fn(async () => ({
    Checkout: { open: vi.fn() },
  })),
}));

import PricingClient from "@/components/pricing-client";
import { TeamShowcase } from "@/components/team-showcase";
import FeaturesPageClient, {
  FEATURES_FAQ,
  FeaturesFaqSection,
} from "@/components/features-page-client";
import { TEAM_MEMBERS, type TeamMember } from "@/lib/team";

const FREE_TIER: Tier = {
  name: "Free",
  description: "Free desc",
  features: ["f1"],
  priceId: { month: "", year: "" },
  cta: "Start free",
  ctaKind: "signup",
};

const PRO_TIER: Tier = {
  name: "Pro",
  description: "Pro desc",
  features: ["f1"],
  priceId: { month: "pri_pro_monthly", year: "pri_pro_yearly" },
  cta: "Subscribe",
  ctaKind: "checkout",
};

describe("P2C — team faces-ready", () => {
  it("fallback renders initials when photo is undefined", () => {
    const { container } = render(<TeamShowcase />);
    // No photos shipped in P2 — readiness only, so no <img>.
    expect(container.querySelector("img")).toBeNull();
    for (const m of TEAM_MEMBERS) {
      expect(screen.getByText(m.initials)).toBeInTheDocument();
    }
    // Fixed avatar shell: no layout shift when photos land.
    const shells = container.querySelectorAll("span.w-11.h-11.rounded-full");
    expect(shells.length).toBe(TEAM_MEMBERS.length);
  });

  it("TeamMember accepts optional photo without breaking initials default", () => {
    for (const m of TEAM_MEMBERS) {
      expect(m.photo).toBeUndefined();
      expect(m.initials.length).toBeGreaterThan(0);
    }
    // Type-level: photo is optional.
    const withPhoto: TeamMember = {
      role: "Founder",
      name: "Test Person",
      focus: "Test focus",
      initials: "TP",
      photo: "/team/test.jpg",
    };
    expect(withPhoto.photo).toBe("/team/test.jpg");
    expect(withPhoto.initials).toBe("TP");
  });
});

describe("P2C — pricing FAQPage JSON-LD", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_CLIENT_KEY", "test_abc");
    vi.mocked(initializePaddle).mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ prices: {} }) })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("emits FAQPage schema from the FAQ const with no visual change", async () => {
    const { container } = render(
      <PricingClient initialCountry={null} tiers={[FREE_TIER, PRO_TIER]} />
    );
    // Visible FAQ still renders from the same const.
    expect(screen.getByText("Do I need a credit card to start?")).toBeInTheDocument();

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const ld = JSON.parse(script!.textContent || "");
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("FAQPage");
    expect(Array.isArray(ld.mainEntity)).toBe(true);
    expect(ld.mainEntity).toHaveLength(6);
    const names = ld.mainEntity.map((e: { name: string }) => e.name);
    expect(names).toContain("Do I need a credit card to start?");
    for (const e of ld.mainEntity) {
      expect(e["@type"]).toBe("Question");
      expect(e.acceptedAnswer["@type"]).toBe("Answer");
      expect(typeof e.acceptedAnswer.text).toBe("string");
    }
  });
});

describe("P2C — features FAQ block + schema", () => {
  it("ships 5 honest Qs (migrate, languages, train, radar, free minutes)", () => {
    expect(FEATURES_FAQ).toHaveLength(5);
    const joined = FEATURES_FAQ.map((f) => `${f.q} ${f.a}`).join("\n").toLowerCase();
    expect(joined).toMatch(/migrat|otter/);
    expect(joined).toMatch(/language|auto-detect/);
    expect(joined).toMatch(/train/);
    expect(joined).toMatch(/radar|slack/);
    expect(joined).toMatch(/300.*minute|free/);
  });

  it("renders the FAQ section with accessible disclosures", () => {
    render(<FeaturesFaqSection />);
    expect(
      screen.getByRole("heading", { name: /features questions, answered/i })
    ).toBeInTheDocument();
    for (const f of FEATURES_FAQ) {
      expect(screen.getByText(f.q)).toBeInTheDocument();
    }
    // Server-safe disclosures: no client state, plain details/summary.
    const section = document.getElementById("faq");
    expect(section).not.toBeNull();
    expect(section!.querySelectorAll("details").length).toBe(FEATURES_FAQ.length);
  });

  it("full page mounts FAQ after comparison with FAQPage JSON-LD", () => {
    Object.defineProperty(window, "matchMedia", {
      value: vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
      writable: true,
      configurable: true,
    });
    const { container } = render(<FeaturesPageClient />);
    // FAQ heading exists on the full page.
    expect(
      screen.getByRole("heading", { name: /features questions, answered/i })
    ).toBeInTheDocument();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const ld = JSON.parse(script!.textContent || "");
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(FEATURES_FAQ.length);
    // Spot-check one question made it into the schema.
    const names = ld.mainEntity.map((e: { name: string }) => e.name);
    expect(names.some((n: string) => /radar/i.test(n))).toBe(true);
    // CTA still present after FAQ (mount order preserved).
    expect(screen.getByText(/ready to save hours/i)).toBeInTheDocument();
  });

  it("page source mounts FeaturesFaqSection between ComparisonSection and CTA", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(
      join(process.cwd(), "src/components/features-page-client.tsx"),
      "utf8"
    );
    const comparisonIdx = src.indexOf("<ComparisonSection />");
    const faqIdx = src.indexOf("<FeaturesFaqSection />");
    const ctaIdx = src.indexOf("Ready to save hours every week?");
    expect(comparisonIdx).toBeGreaterThan(-1);
    expect(faqIdx).toBeGreaterThan(comparisonIdx);
    expect(ctaIdx).toBeGreaterThan(faqIdx);
    expect(src).toContain('"@type": "FAQPage"');
    // Server-safe: FAQ section uses details/summary, no useState.
    const faqSection = src.slice(src.indexOf("export function FeaturesFaqSection"));
    expect(faqSection).toContain("<details");
    expect(faqSection).not.toContain("useState");
  });
});
